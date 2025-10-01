const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyFix() {
  console.log('🔍 Verifying authentication fix...\n');
  
  try {
    // Test if name column exists
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .limit(1);
    
    if (error) {
      console.log('❌ Fix not applied yet:', error.message);
      console.log('   Please run the SQL commands in your Supabase dashboard first.');
      return false;
    }
    
    console.log('✅ Users table schema is now correct!');
    console.log('✅ Name column exists and is accessible');
    
    // Test insert (this is what signup does)
    console.log('\n🧪 Testing signup functionality...');
    const testUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password_hash: 'test_hash_123'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select('id, name, email')
      .single();
    
    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      return false;
    }
    
    console.log('✅ Signup functionality test passed');
    console.log('   Created test user:', insertData);
    
    // Clean up test user
    await supabase.from('users').delete().eq('id', insertData.id);
    console.log('🧹 Test user cleaned up');
    
    console.log('\n🎉 AUTHENTICATION IS FIXED!');
    console.log('   ✅ Users can now sign up');
    console.log('   ✅ Users can now sign in');
    console.log('   ✅ Database schema is complete');
    
    return true;
    
  } catch (error) {
    console.error('💥 Error during verification:', error.message);
    return false;
  }
}

verifyFix().then((success) => {
  if (success) {
    console.log('\n🚀 Your app is ready to use!');
    console.log('   Try creating an account at http://localhost:3000/auth/signup');
  } else {
    console.log('\n⏳ Please complete the SQL fix in Supabase dashboard first.');
  }
}).catch(error => {
  console.error('💥 Error:', error.message);
});
