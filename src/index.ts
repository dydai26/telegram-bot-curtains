import { Telegraf, Context, session, Markup, Telegram } from 'telegraf';
import dotenv from 'dotenv';
import * as db from './supabase.js';
import * as ai from './ai.js';

dotenv.config();

const botToken = process.env.BOT_TOKEN || '';
const notifyToken = process.env.NOTIFY_BOT_TOKEN;

if (!botToken) {
    console.error('BOT_TOKEN is missing in .env');
    process.exit(1);
}

interface MySession {
    state?: 'choosing_type' | 'awaiting_width' | 'awaiting_height' | 'awaiting_phone' | 'choosing_delivery' | 'awaiting_address' | 'awaiting_name';
    selectedProduct?: any;
    width?: number;
    height?: number;
    purchaseType?: 'no_sew' | 'sewing';
    deliveryMethod?: 'nova_poshta' | 'ukr_poshta';
    tempName?: string;
    tempPhone?: string;
}

interface MyContext extends Context {
    session: MySession;
}

const bot = new Telegraf<MyContext>(botToken);
const notifyBot = notifyToken ? new Telegram(notifyToken) : bot.telegram;

bot.use(session());

// Initialize session if not exists
bot.use((ctx, next) => {
    ctx.session = ctx.session || {};
    return next();
});

// /start command
bot.start(async (ctx) => {
    await db.syncUser(ctx.from);
    return ctx.reply(
        'Вітаємо у магазині тюлей та штор! 🪟\nОберіть розділ:',
        Markup.keyboard([
            ['🪟 Тюль', '🛋 Штори'],
            ['📏 Калькулятор', '📦 Мої замовлення']
        ]).resize()
    );
});

// Handle Categories
bot.hears(['🪟 Тюль', '🛋 Штори'], async (ctx) => {
    const categoryName = ctx.message.text.includes('Тюль') ? 'Тюль' : 'Штори';
    const categories = await db.getCategories();
    const category = categories.find(c => c.name === categoryName);

    if (!category) {
        return ctx.reply('Категорію не знайдено.');
    }

    const products = await db.getProductsByCategory(category.id);
    if (products.length === 0) {
        return ctx.reply('Товарів у цій категорії поки немає.');
    }

    for (const product of products) {
        const message = `*${product.name}*\n\n${product.description}\n\nЦіна: ${product.price_per_meter} грн/м`;
        const buttons = Markup.inlineKeyboard([
            [Markup.button.callback('Розрахувати вартість 📏', `calc_${product.id}`)]
        ]);

        try {
            if (product.image_url) {
                await ctx.replyWithPhoto(product.image_url, { caption: message, parse_mode: 'Markdown', ...buttons });
            } else {
                await ctx.reply(message, { parse_mode: 'Markdown', ...buttons });
            }
        } catch (error) {
            console.error('Error sending photo:', error);
            await ctx.reply(message, { parse_mode: 'Markdown', ...buttons });
        }
    }
});

// Calculation Start
bot.action(/^calc_(.+)$/, async (ctx) => {
    const productId = (ctx.match as any)[1];
    const product = await db.getProduct(productId);
    
    ctx.session.selectedProduct = product;
    ctx.session.state = 'choosing_type';
    
    await ctx.answerCbQuery();
    return ctx.reply(`Як ви бажаєте придбати ${product.name}?`, Markup.inlineKeyboard([
        [Markup.button.callback('📦 Без пошиття (тільки тканина)', 'type_no_sew')],
        [Markup.button.callback('🪡 З пошиттям (під ключ)', 'type_sewing')]
    ]));
});

bot.action('type_no_sew', async (ctx) => {
    ctx.session.purchaseType = 'no_sew';
    ctx.session.state = 'awaiting_width';
    await ctx.answerCbQuery();
    return ctx.reply('Введіть потрібну кількість метрів погонних (ширину):');
});

bot.action('type_sewing', async (ctx) => {
    ctx.session.purchaseType = 'sewing';
    ctx.session.state = 'awaiting_width';
    await ctx.answerCbQuery();
    return ctx.reply('Введіть ширину карниза (або кількість метрів тканини для пошиття):');
});

bot.action('order_confirm', async (ctx) => {
    ctx.session.state = 'choosing_delivery';
    await ctx.answerCbQuery();
    return ctx.reply('Оберіть спосіб доставки:', Markup.inlineKeyboard([
        [Markup.button.callback('📦 Нова Пошта', 'delivery_nova')],
        [Markup.button.callback('🏤 Укрпошта', 'delivery_ukr')]
    ]));
});

bot.action(/delivery_(.+)/, async (ctx) => {
    const method = ctx.match[1];
    ctx.session.deliveryMethod = method === 'nova' ? 'nova_poshta' : 'ukr_poshta';
    ctx.session.state = 'awaiting_name';
    await ctx.answerCbQuery();
    return ctx.reply('Введіть Прізвище та Імʼя отримувача:');
});

bot.action('order_cancel', (ctx) => {
    ctx.session = {};
    return ctx.editMessageText('Замовлення скасовано.');
});

// Handle Text Inputs (Width, Height, Phone)
bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const session = ctx.session;

    if (session.state === 'awaiting_width') {
        const width = parseFloat(text.replace(',', '.'));
        if (isNaN(width) || width <= 0) {
            return ctx.reply('Будь ласка, введіть коректне число для ширини.');
        }
        session.width = width;

        if (session.purchaseType === 'no_sew') {
            const product = session.selectedProduct;
            const totalPrice = width * product.price_per_meter;
            
            const summary = `🧮 *Розрахунок (Тільки тканина):*\n` +
                `🔹 Товар: ${product.name}\n` +
                `📐 Кількість: ${width} м.п.\n` +
                `💰 *Разом: ${totalPrice.toFixed(2)} грн*`;

            return ctx.reply(summary, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('✅ Оформити замовлення', 'order_confirm')],
                    [Markup.button.callback('❌ Скасувати', 'order_cancel')]
                ])
            });
        } else {
            session.state = 'awaiting_height';
            return ctx.reply('Введіть висоту готового виробу (у метрах):');
        }
    }

    if (session.state === 'awaiting_height') {
        const height = parseFloat(text.replace(',', '.'));
        if (isNaN(height) || height <= 0) {
            return ctx.reply('Будь ласка, введіть коректне число для висоти.');
        }
        session.height = height;
        
        const product = session.selectedProduct;
        const width = session.width!;
        
        // Визначаємо вартість пошиття залежно від типу товару
        const isCurtain = product.name.toLowerCase().includes('штор') || 
                          product.description?.toLowerCase().includes('штор');
        
        const sewingRate = isCurtain ? 65 : 35;
        const tapeRate = 10;
        
        const fabricPrice = width * product.price_per_meter;
        const tapePrice = width * tapeRate;
        const sewingPrice = width * sewingRate;
        const totalPrice = fabricPrice + tapePrice + sewingPrice;
        
        const summaryText = `🧮 Розрахунок (З пошиттям):\n` +
            `🔹 Товар: ${product.name}\n` +
            `📏 Розміри: ${width} × ${height} м\n` +
            `------------------------\n` +
            `🧵 Тканина: ${fabricPrice.toFixed(2)} грн\n` +
            `🎞 Стрічка (${tapeRate} грн/м): ${tapePrice.toFixed(2)} грн\n` +
            `🪡 Робота (${sewingRate} грн/м): ${sewingPrice.toFixed(2)} грн\n` +
            `------------------------\n` +
            `💰 Загальна вартість: ${totalPrice.toFixed(2)} грн`;

        return ctx.reply(summaryText, {
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Оформити замовлення', 'order_confirm')],
                [Markup.button.callback('❌ Скасувати', 'order_cancel')]
            ])
        });
    }
    if (session.state === 'awaiting_name') {
        if (text.length < 3) {
            return ctx.reply('Будь ласка, введіть повне імʼя та прізвище.');
        }
        session.tempName = text;
        session.state = 'awaiting_phone';
        return ctx.reply('Тепер введіть ваш номер телефону:');
    }

    if (session.state === 'awaiting_phone') {
        const phone = text;
        const phoneRegex = /^\+?[\d\s-]{10,20}$/;
        if (!phoneRegex.test(phone)) {
            return ctx.reply('Будь ласка, введіть коректний номер телефону.');
        }
        session.height = session.height || 0; // fallback if no_sew
        session.tempPhone = phone;
        session.state = 'awaiting_address';

        const deliveryLabel = session.deliveryMethod === 'nova_poshta' ? 'Нової Пошти' : 'Укрпошти';
        return ctx.reply(`Введіть адресу доставки (${deliveryLabel}):\n📍 Місто, область та номер відділення/індекс`);
    }

    if (session.state === 'awaiting_address') {
        const address = text;
        const product = session.selectedProduct;
        const width = session.width!;
        const phone = session.tempPhone;
        const fullName = session.tempName;
        
        let totalPrice = 0;
        if (session.purchaseType === 'no_sew') {
            totalPrice = width * product.price_per_meter;
        } else {
            const isCurtain = product.name.toLowerCase().includes('штор') || 
                              product.description?.toLowerCase().includes('штор');
            const sewingRate = isCurtain ? 65 : 35;
            totalPrice = (width * product.price_per_meter) + (width * 10) + (width * sewingRate);
        }
        
        const deliveryMethodText = session.deliveryMethod === 'nova_poshta' ? 'Нова Пошта' : 'Укрпошта';

        const order = {
            user_id: ctx.from.id,
            client_name: fullName, // Використовуємо введене ім'я
            phone: phone,
            product_name: product.name,
            width: width,
            height: session.height || 0,
            total_price: totalPrice,
            status: 'pending',
            shipping_address: address,
            shipping_method: deliveryMethodText
        };

        try {
            console.log('--- Processing New Order ---');
            console.log('Order data:', JSON.stringify(order, null, 2));

            // Step 1: Save to Database
            try {
                await db.createOrder(order);
                console.log('✅ Order saved to DB');
            } catch (dbErr) {
                console.error('❌ DB Error:', dbErr);
                // We continue even if DB fails, to at least try notifying the admin
            }
            
            const summaryText = `🔔 НОВЕ ЗАМОВЛЕННЯ!\n\n` +
                `📦 Товар: ${product.name}\n` +
                `📏 Розміри: ${width} x ${session.height || 0} м\n` +
                `🧵 Тип: ${session.purchaseType === 'sewing' ? 'З пошиттям' : 'Тільки тканина'}\n\n` +
                `👤 Отримувач: ${fullName}\n` +
                `📞 Тел: ${phone}\n` +
                `🚛 Доставка: ${deliveryMethodText}\n` +
                `📍 Адреса: ${address}\n` +
                `💰 СУМА: ${totalPrice.toFixed(2)} грн`;

            // Step 2: Notify Admin/Channel
            const adminId = process.env.ADMIN_ID;
            const channelId = process.env.CHANNEL_ID;
            
            if (channelId) {
                console.log('Sending to channel:', channelId);
                try {
                    await notifyBot.sendMessage(channelId, summaryText).catch(e => console.error('Notify Channel Error:', e.message));
                } catch (e) {}
            }

            if (adminId) {
                console.log('Sending to admin:', adminId);
                try {
                    await notifyBot.sendMessage(adminId, summaryText).catch(e => console.error('Notify Admin Error:', e.message));
                } catch (e) {}
            }
            
            // Step 3: Respond to Client
            const clientSummary = `📊 Ваше замовлення:\n\n` +
                `▫️ Товар: ${product.name}\n` +
                `▫️ Отримувач: ${fullName}\n` +
                `▫️ Тел: ${phone}\n` +
                `▫️ Доставка: ${deliveryMethodText}\n` +
                `▫️ Адреса: ${address}\n` +
                `💰 Сума: ${totalPrice.toFixed(2)} грн`;

            await ctx.reply(clientSummary);
            
            await ctx.reply(`✅ Дякуємо за замовлення!\n\nМенеджер зв'яжеться з вами найближчим часом для підтвердження та уточнення деталей.`);
            
            console.log('✅ Order processing completed for user:', ctx.from.id);
            ctx.session = {};
            return; // Додаємо return, щоб не спрацьовував ШІ на повідомлення з адресою
        } catch (e) {
            console.error('General Order Processing Error:', e);
            return ctx.reply('Вибачте, сталася помилка при обробці замовлення. Ми вже працюємо над цим.');
        }
    }

    // AI Consultant fallback
    try {
        const reply = await ai.getAiConsultation(text);
        return ctx.reply(reply);
    } catch (e) {
        return ctx.reply('Я поки не розумію цей запит. Спробуйте скористатись меню.');
    }
});

bot.launch().then(() => {
    console.log('Bot is running...');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
