import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;
const url = process.argv[2];

if (!token || !url) {
  console.log('Usage: node set_webhook.js <YOUR_VERCEL_URL>');
  console.log('Example: node set_webhook.js https://my-bot.vercel.app/api/webhook');
  process.exit(1);
}

const telegramUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${url}`;

console.log(`Setting webhook to: ${url}...`);

axios.get(telegramUrl)
  .then(response => {
    console.log('✅ Webhook set successfully:', response.data);
  })
  .catch(error => {
    console.log('❌ Failed to set webhook:', error.response ? error.response.data : error.message);
  });
