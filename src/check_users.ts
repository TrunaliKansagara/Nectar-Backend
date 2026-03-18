
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const checkUsers = async () => {
    console.log('--- Checking with ANON KEY ---');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonData, error: anonError } = await supabaseAnon.from('users').select('*');
    if (anonError) console.error('Anon Error:', anonError.message);
    else console.log('Anon Users Found:', anonData?.length || 0, anonData?.[0]);

    if (supabaseServiceKey) {
        console.log('\n--- Checking with SERVICE ROLE KEY ---');
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
        const { data: serviceData, error: serviceError } = await supabaseService.from('users').select('*');
        if (serviceError) console.error('Service Error:', serviceError.message);
        else console.log('Service Users Found:', serviceData?.length || 0, serviceData?.[0]);
    } else {
        console.log('\n--- No Service Role Key found in .env ---');
    }
}

checkUsers();
