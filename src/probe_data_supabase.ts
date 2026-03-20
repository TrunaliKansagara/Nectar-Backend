
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const testSupabase = async () => {
    console.log('--- Probing Supabase Logic ---');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
        const banners = await supabase.from('banners').select('id, title', { count: 'exact' });
        console.log('Banners (from table banners):', banners.count, banners.error ? banners.error.message : 'No error');

        const categories = await supabase.from('categories').select('id, name', { count: 'exact' });
        console.log('Categories (from table categories):', categories.count, categories.error ? categories.error.message : 'No error');

        const products = await supabase.from('products').select('id, name', { count: 'exact' });
        console.log('Products (from table products):', products.count, products.error ? products.error.message : 'No error');

        const exclusive = await supabase.from('products').select('id, name', { count: 'exact' }).eq('is_exclusive', true);
        console.log('Exclusive (is_exclusive=true):', exclusive.count, exclusive.error ? exclusive.error.message : 'No error');

        const bestSelling = await supabase.from('products').select('id, name', { count: 'exact' }).eq('is_best_selling', true);
        console.log('Best Selling (is_best_selling=true):', bestSelling.count, bestSelling.error ? bestSelling.error.message : 'No error');

        // Let's check for "brands" table as well because of user's message
        const brands = await supabase.from('brands').select('id, name', { count: 'exact' });
        if (!brands.error) {
            console.log('Brands table exists! Count:', brands.count);
        } else {
            console.log('Brands table ERROR/MISSING:', brands.error.message);
        }

    } catch (err: any) {
        console.error('Probing failed:', err.message);
    }
}

testSupabase();
