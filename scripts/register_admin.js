#!/usr/bin/env node

/**
 * Admin User Registration Script - Direct SQL approach
 */

const SUPABASE_URL = "https://tychkyunjfbkksyxknhn.supabase.co";
const adminEmail = "jkwong.official@gmail.com";
const adminPassword = "TempAdmin123!";

async function registerAdmin() {
  try {
    console.log("🔐 Registering admin user via Supabase Auth API...\n");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}\n`);

    // Call the Supabase Auth API directly
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": "sb_publishable_7W1CjpeazyA-rdP56M73Qg_ZNV4nvlW",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword
        })
      }
    );

    const responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", responseText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const userData = JSON.parse(responseText);
    console.log("\n✅ User created successfully!");
    console.log("User data:", JSON.stringify(userData, null, 2));

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

registerAdmin();
