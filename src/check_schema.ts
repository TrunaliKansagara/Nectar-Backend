
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const checkSchema = async () => {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('--- Checking Tables in public schema ---');
    // We can't easily list tables via supabase-js without RPC, 
    // but we can try common names if 'users' fails.

    const tablesToTry = ['users', 'profiles', 'accounts', 'user_profiles'];

    for (const table of tablesToTry) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table '${table}': FAILED - ${error.message} (${error.code})`);
        } else {
            console.log(`Table '${table}': SUCCESS - Found ${data?.length} rows`);
            if (data && data.length > 0) {
                console.log('Columns:', Object.keys(data[0]));
            }
        }
    }
}

checkSchema();
