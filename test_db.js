import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('categories').select('*').limit(1);
        if (error) {
            console.error('Connection Error:', error.message);
        } else {
            console.log('Connection Successful! Categories found:', data.length);
        }
    } catch (e) {
        console.error('Unexpected Error:', e);
    }
}

testConnection();
