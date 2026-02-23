import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking columns in orders table...');
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    
    if (error) {
        console.error('Error fetching orders:', error.message);
        return;
    }
    
    if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('Current columns:', columns);
        if (!columns.includes('shipping_address')) {
            console.log('❌ Column shipping_address is MISSING');
        } else {
            console.log('✅ Column shipping_address is present');
        }
    } else {
        console.log('Table is empty, cannot check columns easily via select. Trying to insert a test order...');
        const { error: insertError } = await supabase.from('orders').insert([{
            user_id: 1,
            client_name: 'test',
            shipping_address: 'test'
        }]);
        if (insertError) {
            console.error('Insert test failed:', insertError.message);
        } else {
            console.log('Insert test successful, cleaning up...');
            await supabase.from('orders').delete().eq('client_name', 'test');
        }
    }
}

checkColumns();
