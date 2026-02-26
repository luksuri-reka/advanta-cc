import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('complaints').select('*').limit(1);
    if (error) {
        console.error('Error fetching data:', error);
    } else if (data && data.length > 0) {
        console.log('Columns available in complaints table:');
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log('No data found, cannot infer schema via select *. Asking for schema mapping...');
        // We can't get schema without data, but usually select * limit 1 returns columns even if empty array... wait no, supabase rest api returns empty array for empty table, so no keys.
    }
}

checkColumns();
