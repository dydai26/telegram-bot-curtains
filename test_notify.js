import { Telegram } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const token = '6577573966:AAGUcRIGfVPpvbZcYdxr6VbnZWGjB-v7z1A';
const adminId = '539511183';

const telegram = new Telegram(token);

async function testNotify() {
    try {
        console.log(`Sending test message to ${adminId}...`);
        await telegram.sendMessage(adminId, 'Test message from your notification bot!');
        console.log('✅ Success! The bot can send messages to you.');
    } catch (error) {
        console.error('❌ Error sending message:', error.message);
        if (error.message.includes('bot was blocked by the user')) {
            console.log('You need to unblock the bot or press /start in @zakazcurtainbot');
        } else if (error.message.includes('chat not found')) {
            console.log('You MUST press /start in @zakazcurtainbot first!');
        }
    }
}

testNotify();
