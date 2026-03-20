
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const probeSingular = async () => {
    console.log('--- Probing Singular Table Names ---');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: cat, error: catError } = await supabase.from('category').select('id, name').limit(1);
    if (!catError) {
        console.log('Category table (singular) exists!');
    } else {
        console.log('Category table (singular) missing:', catError.message);
    }
}

probeSingular();
