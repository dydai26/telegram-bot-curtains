import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Помилка: SUPABASE_URL або SUPABASE_ANON_KEY не знайдені в .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const products = [
    {
        category: 'Тюль',
        name: 'Тюль Льон Білий',
        description: 'Класична лляна тюль, ідеально підходить для вітальні.',
        price: 480,
        image_url: 'https://curtain-sofiya-one.vercel.app/baner.jpg'
    },
    {
        category: 'Тюль',
        name: 'Тюль Фатин Сяйво',
        description: 'Ніжна тюль із мікросіткою та легким блиском.',
        price: 350,
        image_url: 'https://curtain-sofiya-one.vercel.app/baner.jpg'
    },
    {
        category: 'Штори',
        name: 'Штори Блекаут Сірі',
        description: 'Світлонепроникні штори для комфортного сну.',
        price: 920,
        image_url: 'https://curtain-sofiya-one.vercel.app/baner.jpg'
    },
    {
        category: 'Штори',
        name: 'Штори Велюр Преміум',
        description: 'Мʼяка оксамитова тканина, глибокий колір.',
        price: 1200,
        image_url: 'https://curtain-sofiya-one.vercel.app/baner.jpg'
    }
];

async function importCatalog() {
    console.log('Починаємо імпорт товарів...');

    for (const item of products) {
        // 1. Отримуємо або створюємо категорію
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('name', item.category)
            .single();

        let categoryId;
        if (catError || !catData) {
            const { data: newCat, error: insError } = await supabase
                .from('categories')
                .insert({ name: item.category })
                .select()
                .single();
            if (insError) {
                console.error(`Помилка створення категорії ${item.category}:`, insError.message);
                continue;
            }
            categoryId = newCat.id;
        } else {
            categoryId = catData.id;
        }

        // 2. Додаємо товар
        const { error: prodError } = await supabase
            .from('products')
            .insert({
                category_id: categoryId,
                name: item.name,
                description: item.description,
                price_per_meter: item.price,
                image_url: item.image_url
            });

        if (prodError) {
            console.error(`Помилка додавання товару ${item.name}:`, prodError.message);
        } else {
            console.log(`✅ Додано: ${item.name}`);
        }
    }

    console.log('Імпорт завершено!');
}

importCatalog();
