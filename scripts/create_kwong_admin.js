#!/usr/bin/env node

/**
 * Create admin user: kwongofficial@gmail.com
 * 
 * Usage: node scripts/create_kwong_admin.js
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
const adminPassword = 'TempAdmin123!'; // User should change this on first login

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables. Make sure .env contains:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🔐 Creating admin user...\n');
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Temporary Password: ${adminPassword}`);
  console.log(`⚠️  User should change password on first login\n`);

  try {
    // Step 1: Create the user via Admin API
    console.log('Step 1: Creating user account...');
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
    });

    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('⚠️  User already exists. Looking up user ID...');
        
        // Try to get the user ID
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          throw new Error(`Failed to list users: ${listError.message}`);
        }
        
        const existingUser = existingUsers.users.find(u => u.email === adminEmail);
        
        if (!existingUser) {
          throw new Error('User exists but could not find their ID');
        }
        
        console.log(`✅ Found existing user: ${existingUser.id}`);
        
        // Step 2: Assign admin role
        console.log('\nStep 2: Assigning admin role...');
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ 
            user_id: existingUser.id, 
            role: 'admin' 
          }, {
            onConflict: 'user_id,role'
          });

        if (roleError) {
          throw new Error(`Failed to assign admin role: ${roleError.message}`);
        }

        console.log('✅ Admin role assigned successfully!');
        
        // Step 3: Verify role assignment
        console.log('\nStep 3: Verifying role...');
        const { data: roles, error: roleCheckError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', existingUser.id);

        if (roleCheckError) {
          console.warn(`⚠️  Could not verify roles: ${roleCheckError.message}`);
        } else {
          console.log('✅ User roles:', roles.map(r => r.role).join(', '));
        }

        console.log('\n✅ Admin user is ready!');
        console.log(`\n📋 Login credentials:`);
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   URL: ${SUPABASE_URL.replace('https://', 'https://').replace('.supabase.co', '.supabase.co')}`);
        
        return;
      }
      
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log(`✅ User created with ID: ${user.user.id}`);

    // Step 2: Assign admin role
    console.log('\nStep 2: Assigning admin role...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ 
        user_id: user.user.id, 
        role: 'admin' 
      });

    if (roleError) {
      // Try upsert in case the role already exists
      const { error: upsertError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: user.user.id, 
          role: 'admin' 
        }, {
          onConflict: 'user_id,role'
        });
      
      if (upsertError) {
        throw new Error(`Failed to assign admin role: ${upsertError.message}`);
      }
    }

    console.log('✅ Admin role assigned successfully!');

    // Step 3: Verify role assignment
    console.log('\nStep 3: Verifying role...');
    const { data: roles, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id);

    if (roleCheckError) {
      console.warn(`⚠️  Could not verify roles: ${roleCheckError.message}`);
    } else {
      console.log('✅ User roles:', roles.map(r => r.role).join(', '));
    }

    console.log('\n🎉 Admin user created successfully!');
    console.log(`\n📋 Login credentials:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  Please change password on first login`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

createAdminUser();
