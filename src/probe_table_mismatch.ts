
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const probeBrands = async () => {
    console.log('--- Probing Brand Columns ---');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: brands, error: brandsError } = await supabase.from('brands').select('*').limit(1);
    if (!brandsError && brands && brands.length > 0) {
        console.log('Columns in brands:', Object.keys(brands[0]));
    } else {
        console.log('Brands table empty or missing.');
    }

    const { data: banners, error: bannersError } = await supabase.from('banners').select('*').limit(1);
    if (!bannersError && banners && banners.length > 0) {
        console.log('Columns in banners:', Object.keys(banners[0]));
    } else {
        console.log('Banners table empty or missing.');
    }
}

probeBrands();
