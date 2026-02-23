import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getCategories() {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    return data;
}

export async function getProductsByCategory(categoryId: string) {
    const { data, error } = await supabase.from('products').select('*').eq('category_id', categoryId);
    if (error) throw error;
    return data;
}

export async function getProduct(productId: string) {
    const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
    if (error) throw error;
    return data;
}

export async function createOrder(order: any) {
    const { data, error } = await supabase.from('orders').insert([order]).select();
    if (error) throw error;
    return data[0];
}

export async function syncUser(user: any) {
    const { error } = await supabase.from('bot_users').upsert({
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        last_active: new Date().toISOString()
    });
    if (error) console.error('Error syncing user:', error);
}
