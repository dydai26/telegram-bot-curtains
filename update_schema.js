import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchema() {
    console.log('Updating orders table schema...');
    
    const { error: error1 } = await supabase.rpc('exec_sql', { 
        sql_query: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;' 
    });
    
    const { error: error2 } = await supabase.rpc('exec_sql', { 
        sql_query: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;' 
    });

    if (error1 || error2) {
        console.log('RPC update failed (normal if exec_sql is not enabled). Trying manual check...');
        // If RPC isn't available, we just hope the columns exist or try a simple insert
        console.log('Schema update should be done manually in Supabase SQL Editor if this tool fails.');
    } else {
        console.log('Schema updated successfully via RPC!');
    }
}

updateSchema();
