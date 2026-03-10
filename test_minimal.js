import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log('Test bot: Testing bot.telegram.getMe()...');
bot.telegram.getMe().then(me => {
    console.log('Test bot: ✅ getMe working:', me.username);
    bot.start((ctx) => ctx.reply('Hello!'));
    console.log('Test bot: Launching...');
    bot.launch({ dropPendingUpdates: true }).then(() => {
        console.log('Test bot: ✅ Running');
    }).catch(err => {
        console.error('Test bot: ❌ Failed', err);
    });
}).catch(err => {
    console.error('Test bot: ❌ getMe failed', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
