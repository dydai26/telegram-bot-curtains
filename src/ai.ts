import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENCLAW_URL = process.env.OPENCLAW_URL;

export async function getAiConsultation(userMessage: string, history: any[] = []) {
    try {
        // Integration with OpenClaw Gateway if URL is provided
        if (OPENCLAW_URL) {
             // If we're using the OpenClaw API directly
             const response = await axios.post(`${OPENCLAW_URL}/chat`, {
                message: userMessage,
                history: history
            });
            return response.data.reply;
        }

        // Default to OpenAI if available
        if (OPENAI_API_KEY) {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: 'Ти - професійний консультант у магазині тюлей та штор "Curtain Sofiya". Допомагай клієнтам обрати тканину за стилем, щільністю та призначенням. Відповідай українською мовою. Будь ввічливим та експертним.' },
                    ...history,
                    { role: 'user', content: userMessage }
                ]
            }, {
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
            });
            return response.data.choices[0].message.content;
        }

        return 'На жаль, консультант зараз не доступний. Але я вже почав інтеграцію з OpenClaw для вас!';
    } catch (error) {
        console.error('AI Error:', error);
        return 'Виникла помилка під час запиту до консультанта.';
    }
}
