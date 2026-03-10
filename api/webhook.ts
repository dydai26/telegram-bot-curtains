import { bot } from '../src/index.js';

export default async (request: any, response: any) => {
  try {
    if (request.method !== 'POST') {
      return response.status(200).send('Please send a POST request');
    }
    
    const { body } = request;
    if (body) {
      await bot.handleUpdate(body);
    }
    response.status(200).send('OK');
  } catch (error) {
    console.error('Error handling update:', error);
    response.status(200).send('Error but OK');
  }
};
