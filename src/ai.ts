import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENCLAW_URL = process.env.OPENCLAW_URL;

export async function getAiConsultation(userMessage: string, history: any[] = []) {
    // 1. Try OpenClaw if configured
    if (OPENCLAW_URL) {
        try {
            console.log(`Trying OpenClaw at ${OPENCLAW_URL}...`);
            const response = await axios.post(`${OPENCLAW_URL}/chat`, {
                message: userMessage,
                history: history
            }, { timeout: 3000 }); // Add timeout to not hang
            
        } catch (error: any) {
            console.warn('OpenClaw /chat failed:', error.message);
            
            // If /chat failed with 405, try OpenAI-compatible endpoint
            if (error.response && error.response.status === 405) {
                try {
                    console.log('Trying OpenClaw OpenAI-compatible endpoint...');
                    const aiResponse = await axios.post(`${OPENCLAW_URL}/v1/chat/completions`, {
                        model: 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: userMessage }]
                    }, { timeout: 5000 });
                    if (aiResponse.data && aiResponse.data.choices) {
                        return aiResponse.data.choices[0].message.content;
                    }
                } catch (innerError: any) {
                    console.warn('OpenClaw OpenAI-compatible endpoint also failed:', innerError.message);
                }
            }
        }
    }

    // 2. Try OpenAI as primary or fallback
    if (OPENAI_API_KEY) {
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'Ти - професійний консультант у магазині тюлей та штор "Curtain Sofiya". Допомагай клієнтам обрати тканину за стилем, щільністю та призначенням. Відповідай українською мовою. Будь ввічливим та експертним.' },
                    ...history,
                    { role: 'user', content: userMessage }
                ]
            }, {
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
                timeout: 10000
            });
            return response.data.choices[0].message.content;
        } catch (error: any) {
            console.error('OpenAI Error:', error.message);
        }
    }

    return 'На жаль, консультант зараз не доступний. Спробуйте скористатись меню або зачекайте, поки ми налаштуємо звʼязок.';
}
