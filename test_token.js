import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error('No token found');
    process.exit(1);
}

console.log(`Testing token: ${token.substring(0, 10)}...`);

axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`)
    .then(res => {
        console.log('Webhook info:', res.data.result);
        if (res.data.result.url) {
            console.log('⚠️ Warning: Bot has a webhook set up. Long polling (launch()) might not work unless it is deleted.');
        }
    })
    .catch(err => console.error('Error getting webhook info:', err.message));

axios.get(`https://api.telegram.org/bot${token}/getMe`)
    .then(res => {
        console.log('✅ Token is valid!');
        console.log('Bot info:', res.data.result);
    })
    .catch(err => {
        console.error('❌ Token is invalid or network error!');
        if (err.response) {
            console.error('Data:', err.response.data);
            console.error('Status:', err.response.status);
        } else {
            console.error('Error:', err.message);
        }
    });
