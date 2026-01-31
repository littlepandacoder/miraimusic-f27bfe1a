#!/usr/bin/env node

/**
 * Fix admin role for kwongofficial@gmail.com
 * This script removes student role and adds admin role
 * 
 * Usage: node scripts/fix_kwong_admin_role.js
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
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminEmail = 'kwongofficial@gmail.com';

if (!SUPABASE_URL) {
  console.error('❌ Missing VITE_SUPABASE_URL in .env');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('⚠️  Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('\nPlease run the SQL script instead:');
  console.error('  1. Go to Supabase SQL Editor');
  console.error('  2. Run scripts/fix_kwong_admin_role.sql');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdminRole() {
  console.log('🔧 Fixing admin role for:', adminEmail, '\n');

  try {
    // Step 1: Find the user
    console.log('Step 1: Finding user...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    const user = existingUsers.users.find(u => u.email === adminEmail);
    
    if (!user) {
      throw new Error(`User ${adminEmail} not found!`);
    }
    
    console.log(`✅ Found user: ${user.id}`);

    // Step 2: Check current roles
    console.log('\nStep 2: Checking current roles...');
    const { data: currentRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.warn(`⚠️  Could not fetch current roles: ${rolesError.message}`);
    } else {
      console.log('Current roles:', currentRoles.map(r => r.role).join(', ') || '(none)');
    }

    // Step 3: Delete student role if exists
    console.log('\nStep 3: Removing student role (if exists)...');
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.id)
      .eq('role', 'student');

    if (deleteError && !deleteError.message.includes('No rows found')) {
      console.warn(`⚠️  Could not delete student role: ${deleteError.message}`);
    } else {
      console.log('✅ Student role removed (if it existed)');
    }

    // Step 4: Add admin role
    console.log('\nStep 4: Adding admin role...');
    const { error: insertError } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: user.id, 
        role: 'admin' 
      }, {
        onConflict: 'user_id,role'
      });

    if (insertError) {
      throw new Error(`Failed to add admin role: ${insertError.message}`);
    }

    console.log('✅ Admin role added!');

    // Step 5: Verify
    console.log('\nStep 5: Verifying roles...');
    const { data: finalRoles, error: verifyError } = await supabase
      .from('user_roles')
      .select('role, created_at')
      .eq('user_id', user.id);

    if (verifyError) {
      console.warn(`⚠️  Could not verify roles: ${verifyError.message}`);
    } else {
      console.log('\n✅ Final roles for', adminEmail, ':');
      finalRoles.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.role} (assigned: ${new Date(r.created_at).toLocaleString()})`);
      });
    }

    console.log('\n🎉 Admin role fixed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Clear browser cache/localStorage (or use incognito)');
    console.log('  2. Log out if currently logged in');
    console.log('  3. Log in again to see admin dashboard');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTry running the SQL script instead:');
    console.error('  scripts/fix_kwong_admin_role.sql');
    process.exit(1);
  }
}

fixAdminRole();
