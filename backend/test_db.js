import { supabase, isSupabaseConfigured } from './supabase.js';

console.log('--- Testing Supabase Database Connection ---');
console.log('isSupabaseConfigured:', isSupabaseConfigured);

if (!isSupabaseConfigured || !supabase) {
  console.error('❌ Supabase is not properly configured. Check SUPABASE_URL and SUPABASE_KEY in backend/.env');
  process.exit(1);
}

try {
  // Test query on 'users' table
  const { data, error, count } = await supabase
    .from('users')
    .select('id, email, role', { count: 'exact' })
    .limit(5);

  if (error) {
    console.error('⚠️ Connected to Supabase endpoint, but encountered query error:', error.message);
    if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('👉 Tip: The database tables have not been created yet. Run the SQL scripts in supabase/01_schema_and_tables.sql and 02_seed_initial_data.sql in the Supabase SQL Editor.');
    }
  } else {
    console.log('✅ Successfully connected to Supabase PostgreSQL database!');
    console.log(`📊 Total users found in database: ${count !== null ? count : data?.length || 0}`);
    if (data && data.length > 0) {
      console.log('Sample users from database:', data.map(u => ({ email: u.email, role: u.role })));
    } else {
      console.log('ℹ️ The `users` table exists but contains no rows yet. Consider running supabase/02_seed_initial_data.sql in Supabase SQL Editor.');
    }
  }
} catch (err) {
  console.error('❌ Connection failed with exception:', err.message);
}
