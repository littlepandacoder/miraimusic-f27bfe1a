#!/usr/bin/env node

/**
 * Check user roles in the database
 * Usage: node scripts/check_user_roles.js [email]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const emailToCheck = process.argv[2] || 'kwongofficial@gmail.com';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables. Make sure .env contains:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

// Create client with anon key (same as frontend uses)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUserRoles() {
  console.log(`🔍 Checking roles for: ${emailToCheck}\n`);

  try {
    // Note: We can't query auth.users directly with anon key, but we can check user_roles
    // First, let's try to get the current session if logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('📧 Current logged-in user:', session.user.email);
      console.log('🆔 User ID:', session.user.id);
      
      // Get roles for current user
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, created_at')
        .eq('user_id', session.user.id);
      
      if (rolesError) {
        console.error('❌ Error fetching roles:', rolesError.message);
      } else {
        console.log('\n✅ Roles found:', rolesData.length);
        rolesData.forEach((r, i) => {
          console.log(`  ${i + 1}. Role: "${r.role}" (created: ${new Date(r.created_at).toLocaleString()})`);
        });
      }
    } else {
      console.log('⚠️  No user is currently logged in.');
      console.log('\nTo check roles:');
      console.log('1. Log in to your app first');
      console.log('2. Run this script again');
      console.log('\nOR run the SQL query in Supabase Dashboard:');
      console.log(`
SELECT u.email, u.id, ur.role, ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = '${emailToCheck}';
      `);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserRoles();
