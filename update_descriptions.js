import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCurtainsDescription() {
    console.log('🔄 Updating descriptions for curtains...');
    
    const newDescription = 'Штори льон - блекаут , виробник Туреччина, висота матеріалу в рулоні 2,90м . Продаємо на метраж або шиємо під індивідуальні розміри , відправляємо без передоплати';

    // 1. Get the 'Штори' category ID
    const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('id')
        .eq('name', 'Штори')
        .single();

    if (catErr || !catData) {
        console.error('❌ Could not find category "Штори":', catErr?.message);
        return;
    }

    // 2. Update all products in this category
    const { data, error } = await supabase
        .from('products')
        .update({ description: newDescription })
        .eq('category_id', catData.id);

    if (error) {
        console.error('❌ Error updating products:', error.message);
    } else {
        console.log('✅ Success! All curtains now have the new description.');
    }
}

updateCurtainsDescription();
