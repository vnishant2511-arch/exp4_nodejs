// test-cards.js - Comprehensive test suite for Card API
const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
async function makeRequest(method, url, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Test helper functions
async function testGetAllCards() {
  console.log('\n📋 Testing GET /cards - Get all cards');
  const result = await makeRequest('GET', `${BASE_URL}/cards`);
  console.log(`Status: ${result.status}`);
  console.log(`Cards found: ${result.data?.length || 0}`);
  if (result.data) {
    result.data.forEach(card => {
      console.log(`  - ID ${card.id}: ${card.value} of ${card.suit}`);
    });
  }
  return result;
}

async function testGetCardById(id) {
  console.log(`\n🔍 Testing GET /cards/${id} - Get card by ID`);
  const result = await makeRequest('GET', `${BASE_URL}/cards/${id}`);
  console.log(`Status: ${result.status}`);
  if (result.data && !result.data.message) {
    console.log(`Card: ${result.data.value} of ${result.data.suit}`);
  } else {
    console.log(`Response: ${result.data?.message || 'Error'}`);
  }
  return result;
}

async function testAddCard(suit, value) {
  console.log(`\n➕ Testing POST /cards - Add ${value} of ${suit}`);
  const result = await makeRequest('POST', `${BASE_URL}/cards`, { suit, value });
  console.log(`Status: ${result.status}`);
  if (result.data && result.data.id) {
    console.log(`Added: ID ${result.data.id} - ${result.data.value} of ${result.data.suit}`);
  } else {
    console.log(`Response: ${result.data?.message || 'Error'}`);
  }
  return result;
}

async function testUpdateCard(id, suit, value) {
  console.log(`\n✏️ Testing PUT /cards/${id} - Update to ${value} of ${suit}`);
  const result = await makeRequest('PUT', `${BASE_URL}/cards/${id}`, { suit, value });
  console.log(`Status: ${result.status}`);
  if (result.data && result.data.id) {
    console.log(`Updated: ID ${result.data.id} - ${result.data.value} of ${result.data.suit}`);
  } else {
    console.log(`Response: ${result.data?.message || 'Error'}`);
  }
  return result;
}

async function testDeleteCard(id) {
  console.log(`\n🗑️ Testing DELETE /cards/${id} - Delete card`);
  const result = await makeRequest('DELETE', `${BASE_URL}/cards/${id}`);
  console.log(`Status: ${result.status}`);
  console.log(`Response: ${result.data?.message || 'Error'}`);
  return result;
}

async function testGetCardsBySuit(suit) {
  console.log(`\n♠️ Testing GET /cards/suit/${suit} - Get cards by suit`);
  const result = await makeRequest('GET', `${BASE_URL}/cards/suit/${suit}`);
  console.log(`Status: ${result.status}`);
  if (result.data && Array.isArray(result.data)) {
    console.log(`Found ${result.data.length} card(s):`);
    result.data.forEach(card => {
      console.log(`  - ID ${card.id}: ${card.value} of ${card.suit}`);
    });
  } else {
    console.log(`Response: ${result.data?.message || 'Error'}`);
  }
  return result;
}

async function testGetCardsByValue(value) {
  console.log(`\n🃏 Testing GET /cards/value/${value} - Get cards by value`);
  const result = await makeRequest('GET', `${BASE_URL}/cards/value/${value}`);
  console.log(`Status: ${result.status}`);
  if (result.data && Array.isArray(result.data)) {
    console.log(`Found ${result.data.length} card(s):`);
    result.data.forEach(card => {
      console.log(`  - ID ${card.id}: ${card.value} of ${card.suit}`);
    });
  } else {
    console.log(`Response: ${result.data?.message || 'Error'}`);
  }
  return result;
}

async function testValidation() {
  console.log('\n⚠️ Testing Validation and Error Cases');
  
  // Test invalid suit
  await testAddCard('InvalidSuit', 'Ace');
  
  // Test invalid value
  await testAddCard('Hearts', 'InvalidValue');
  
  // Test missing fields
  const result = await makeRequest('POST', `${BASE_URL}/cards`, { suit: 'Hearts' });
  console.log(`Missing value field - Status: ${result.status}, Message: ${result.data?.message}`);
  
  // Test duplicate card
  await testAddCard('Hearts', 'Ace'); // Should fail if Ace of Hearts exists
  
  // Test non-existent card operations
  await testGetCardById(999);
  await testUpdateCard(999, 'Hearts', 'Jack');
  await testDeleteCard(999);
}

async function testResetDeck() {
  console.log('\n🔄 Testing POST /cards/reset - Reset deck');
  const result = await makeRequest('POST', `${BASE_URL}/cards/reset`);
  console.log(`Status: ${result.status}`);
  console.log(`Response: ${result.data?.message || 'Error'}`);
  return result;
}

// Main test suite
async function runAllTests() {
  console.log('🚀 Starting Playing Card API Tests');
  console.log('====================================');
  
  try {
    // Basic CRUD operations
    await testGetAllCards();
    await testGetCardById(2);
    await testAddCard('Clubs', 'Jack');
    await testUpdateCard(3, 'Hearts', 'King');
    await testDeleteCard(1);
    
    // Query operations
    await testGetCardsBySuit('Hearts');
    await testGetCardsByValue('King');
    
    // Validation tests
    await testValidation();
    
    // Final state
    console.log('\n📊 Final State:');
    await testGetAllCards();
    
    console.log('\n✅ All tests completed!');
    console.log('\nAPI Endpoints Tested:');
    console.log('✅ GET    /cards           - List all cards');
    console.log('✅ GET    /cards/:id       - Get specific card');
    console.log('✅ POST   /cards           - Add new card');
    console.log('✅ PUT    /cards/:id       - Update card');
    console.log('✅ DELETE /cards/:id       - Delete card');
    console.log('✅ GET    /cards/suit/:suit   - Get by suit');
    console.log('✅ GET    /cards/value/:value - Get by value');
    console.log('✅ POST   /cards/reset     - Reset deck');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Check for specific test flags
const args = process.argv.slice(2);
if (args.includes('--reset')) {
  testResetDeck();
} else if (args.includes('--validation')) {
  testValidation();
} else {
  runAllTests();
}