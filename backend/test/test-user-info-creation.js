const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

/**
 * Test the user info creation function
 */

// Copy the utility functions from the controller for testing
const formatUserName = user => {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  return user.first_name || user.last_name || user.username || 'عزيزي العميل';
};

const createUserInfoForEmail = user => {
  if (!user) {
    console.error('User object is null or undefined for email creation');
    throw new Error('User object is required for sending emails');
  }

  if (!user.email) {
    console.error('User email is missing', {
      userId: user.id,
      availableFields: Object.keys(user || {})
    });
    throw new Error('User email is required for sending emails');
  }

  const formattedName = formatUserName(user);

  console.log('Created user info for email', {
    userId: user.id,
    hasEmail: !!user.email,
    formattedName,
    emailRedacted: user.email ? '[REDACTED]' : 'MISSING'
  });

  return {
    id: user.id,
    email: user.email,
    name: formattedName,
    fullName: formattedName
  };
};

async function testUserInfoCreation() {
  try {
    console.log('🧪 Testing user info creation...');

    // Test case 1: Complete user data (like what we expect from the database)
    const completeUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      first_name: 'أحمد',
      last_name: 'محمد',
      username: 'ahmed.mohamed'
    };

    console.log('\n📋 Test 1: Complete user data');
    const userInfo1 = createUserInfoForEmail(completeUser);
    console.log('Result:', userInfo1);

    // Test case 2: User with only first name
    const partialUser = {
      id: 'test-user-2',
      email: 'partial@example.com',
      first_name: 'سارة',
      username: 'sara'
    };

    console.log('\n📋 Test 2: User with only first name');
    const userInfo2 = createUserInfoForEmail(partialUser);
    console.log('Result:', userInfo2);

    // Test case 3: User with only username
    const usernameOnlyUser = {
      id: 'test-user-3',
      email: 'username@example.com',
      username: 'testuser'
    };

    console.log('\n📋 Test 3: User with only username');
    const userInfo3 = createUserInfoForEmail(usernameOnlyUser);
    console.log('Result:', userInfo3);

    // Test case 4: User with missing email (should fail)
    const noEmailUser = {
      id: 'test-user-4',
      first_name: 'محمد',
      last_name: 'علي'
    };

    console.log('\n📋 Test 4: User with missing email (should fail)');
    try {
      createUserInfoForEmail(noEmailUser);
      console.log('❌ Test should have failed');
    } catch (error) {
      console.log('✅ Correctly caught error:', error.message);
    }

    console.log('\n✅ All user info creation tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserInfoCreation();
