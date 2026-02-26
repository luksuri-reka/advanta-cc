require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/complaints?limit=1';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

fetch(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } })
    .then(res => res.json())
    .then(data => {
        if (data && data.length > 0) {
            console.log('Columns:');
            console.log(Object.keys(data[0]).join(', '));
        } else {
            console.log('No data or columns found', data);
        }
    })
    .catch(console.error);
