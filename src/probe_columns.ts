
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const probeColumns = async () => {
    console.log('--- Probing Product Columns ---');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await supabase.from('products').select('*').limit(1);

    if (error) {
        console.error('Error fetching products:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in products:', Object.keys(data[0]));
    } else {
        console.log('No products found to check columns.');
    }
}

probeColumns();
