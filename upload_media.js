import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for storage

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAndImport() {
    console.log('🚀 Starting media import to Supabase...');

    // 1. Ensure bucket exists
    const bucketName = 'products';
    
    console.log('Checking storage bucket...');
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.id === bucketName)) {
        console.log(`Creating public bucket: ${bucketName}`);
        const { error: bucketErr } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png'],
            fileSizeLimit: 10485760 // 10MB
        });
        if (bucketErr) {
            console.error('Error creating bucket:', bucketErr.message);
            process.exit(1);
        }
    }
    const categories = [
        { name: 'Тюль', dir: 'public/tulle', defaultPrice: null },
        { name: 'Штори', dir: 'public/curtains', defaultPrice: 450 }
    ];

    for (const cat of categories) {
        console.log(`\nProcessing category: ${cat.name}`);
        
        // Get or create category
        let { data: catData } = await supabase.from('categories').select('id').eq('name', cat.name).single();
        if (!catData) {
            const { data: newCat, error: catErr } = await supabase.from('categories').insert({ name: cat.name }).select().single();
            if (catErr) {
                console.error(`Error creating category ${cat.name}:`, catErr.message);
                continue;
            }
            catData = newCat;
        }
        const categoryId = catData.id;

        const fullDir = path.join(__dirname, cat.dir);
        if (!fs.existsSync(fullDir)) {
            console.warn(`Directory not found: ${fullDir}`);
            continue;
        }

        const files = fs.readdirSync(fullDir).filter(f => !f.startsWith('.'));

        for (const file of files) {
            const filePath = path.join(fullDir, file);
            
            // Extract price from filename
            let price = cat.defaultPrice;
            if (cat.name === 'Тюль') {
                const match = file.match(/(\d+)/);
                if (match) {
                    price = parseInt(match[1]);
                }
            }

            if (!price) {
                console.warn(`⚠️ Could not determine price for ${file}, skipping.`);
                continue;
            }

            console.log(`Uploading ${file} (Price: ${price} грн/м)...`);

            // Upload to Storage
            const fileBuffer = fs.readFileSync(filePath);
            const safeFileName = file.replace(/[^a-z0-9.]/gi, '_');
            const subFolder = cat.name === 'Тюль' ? 'tulle' : 'curtains';
            const fileName = `${subFolder}/${Date.now()}_${safeFileName}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
                .from(bucketName)
                .upload(fileName, fileBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadErr) {
                console.error(`Error uploading ${file}:`, uploadErr.message);
                continue;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);

            // Insert into Products table
            const { error: prodErr } = await supabase.from('products').insert({
                category_id: categoryId,
                name: `${cat.name} - ${file.split('.')[0]}`,
                description: `${cat.name} високої якості`,
                price_per_meter: price,
                image_url: publicUrl
            });

            if (prodErr) {
                console.error(`Error inserting product ${file}:`, prodErr.message);
            } else {
                console.log(`✅ Success: ${file}`);
            }
        }
    }

    console.log('\n✨ All done!');
}

uploadAndImport();
