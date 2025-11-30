#!/usr/bin/env node

/**
 * Test script to verify encryption service works correctly
 * Run with: node backend/test-encryption.js
 */

// Load environment variables first
require('dotenv').config({ path: './backend/.env' });

console.log('🔍 Testing Encryption Service\n');

// Check if ENCRYPTION_KEY is loaded
console.log('1. Checking environment variables...');
if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY not found in environment');
  process.exit(1);
}
console.log(`✅ ENCRYPTION_KEY loaded (length: ${process.env.ENCRYPTION_KEY.length})`);

if (process.env.ENCRYPTION_KEY.length !== 64) {
  console.error(`❌ ENCRYPTION_KEY must be 64 characters, got ${process.env.ENCRYPTION_KEY.length}`);
  process.exit(1);
}
console.log('✅ ENCRYPTION_KEY has correct length\n');

// Now import the encryption service
console.log('2. Importing encryption service...');
const { encrypt, decrypt } = require('./dist/services/encryption.service');
console.log('✅ Encryption service imported\n');

// Test encryption/decryption
console.log('3. Testing encryption/decryption...');
const testData = 'test-access-token-12345';
console.log(`   Original: ${testData}`);

try {
  const encrypted = encrypt(testData);
  console.log(`   Encrypted: ${encrypted.substring(0, 50)}...`);
  
  const decrypted = decrypt(encrypted);
  console.log(`   Decrypted: ${decrypted}`);
  
  if (decrypted === testData) {
    console.log('✅ Encryption/decryption works correctly\n');
  } else {
    console.error('❌ Decrypted value does not match original');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Encryption test failed:', error.message);
  process.exit(1);
}

console.log('🎉 All tests passed!');
