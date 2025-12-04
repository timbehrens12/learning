/**
 * Environment Variables Test Utility
 * Run this to verify all environment variables are loaded correctly
 */

import { supabase } from './lib/supabase';

export async function testEnvironmentVariables(): Promise<void> {
  console.log('🧪 Testing Environment Variables...\n');

  // Test 1: Check if Supabase URL is loaded
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  console.log('1️⃣ Supabase URL:');
  if (supabaseUrl) {
    console.log('   ✅ Loaded:', supabaseUrl.substring(0, 30) + '...');
  } else {
    console.log('   ❌ Missing: VITE_SUPABASE_URL');
  }

  // Test 2: Check if Supabase Key is loaded
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
  console.log('\n2️⃣ Supabase Key:');
  if (supabaseKey) {
    console.log('   ✅ Loaded:', supabaseKey.substring(0, 30) + '...');
  } else {
    console.log('   ❌ Missing: VITE_SUPABASE_KEY');
  }

  // Test 3: Check if DeepSeek API Key is loaded
  const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  console.log('\n3️⃣ DeepSeek API Key:');
  if (deepseekKey) {
    if (deepseekKey.startsWith('sk-')) {
      console.log('   ✅ Loaded:', deepseekKey.substring(0, 15) + '...');
    } else {
      console.log('   ⚠️  Present but invalid format (should start with "sk-")');
    }
  } else {
    console.log('   ❌ Missing: VITE_DEEPSEEK_API_KEY');
  }

  // Test 4: Test Supabase connection
  console.log('\n4️⃣ Testing Supabase Connection:');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('   ⚠️  Connection error:', error.message);
    } else {
      console.log('   ✅ Connected successfully');
      console.log('   Session:', data.session ? 'Active' : 'No active session');
    }
  } catch (err: any) {
    console.log('   ❌ Connection failed:', err.message);
  }

  // Summary
  console.log('\n📊 Summary:');
  const allPresent = supabaseUrl && supabaseKey && deepseekKey;
  if (allPresent) {
    console.log('   ✅ All environment variables are loaded!');
  } else {
    console.log('   ❌ Some environment variables are missing.');
    console.log('   Make sure your .env file exists and contains all required variables.');
  }

  console.log('\n💡 Tip: Restart your dev server if you just added/updated the .env file\n');
}

// Auto-run if imported directly (for testing)
if (import.meta.hot) {
  // Only run in dev mode
  testEnvironmentVariables();
}

