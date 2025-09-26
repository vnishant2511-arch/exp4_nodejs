// test.js
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

// Test functions
async function testGetSeats() {
  console.log('\n📋 Testing GET /seats...');
  const result = await makeRequest('GET', `${BASE_URL}/seats`);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testLockSeat(seatId, user) {
  console.log(`\n🔒 Testing POST /lock/${seatId}?user=${user}...`);
  const result = await makeRequest('POST', `${BASE_URL}/lock/${seatId}?user=${user}`);
  console.log('Status:', result.status);
  console.log('Response:', result.data);
  return result;
}

async function testConfirmSeat(seatId, user) {
  console.log(`\n✅ Testing POST /confirm/${seatId}?user=${user}...`);
  const result = await makeRequest('POST', `${BASE_URL}/confirm/${seatId}?user=${user}`);
  console.log('Status:', result.status);
  console.log('Response:', result.data);
  return result;
}

async function testUnlockSeat(seatId) {
  console.log(`\n🔓 Testing POST /unlock/${seatId}...`);
  const result = await makeRequest('POST', `${BASE_URL}/unlock/${seatId}`);
  console.log('Status:', result.status);
  console.log('Response:', result.data);
  return result;
}

// Concurrent booking simulation
async function testConcurrentBooking() {
  console.log('\n🏁 Testing Concurrent Booking Scenario...');
  
  // Two users trying to book the same seat simultaneously
  const user1Promise = testLockSeat(1, 'user1');
  const user2Promise = testLockSeat(1, 'user2');
  
  const [result1, result2] = await Promise.all([user1Promise, user2Promise]);
  
  console.log('\nConcurrent lock results:');
  console.log('User1 result:', result1.status, result1.data?.message);
  console.log('User2 result:', result2.status, result2.data?.message);
  
  // The successful user should be able to confirm
  const successfulUser = result1.status === 200 ? 'user1' : 'user2';
  const failedUser = result1.status === 200 ? 'user2' : 'user1';
  
  if (result1.status === 200 || result2.status === 200) {
    console.log(`\n${successfulUser} won the race, confirming booking...`);
    await testConfirmSeat(1, successfulUser);
    
    // Failed user should not be able to confirm
    console.log(`\n${failedUser} trying to confirm (should fail)...`);
    await testConfirmSeat(1, failedUser);
  }
}

// Test lock expiration
async function testLockExpiration() {
  console.log('\n⏰ Testing Lock Expiration...');
  
  // Lock a seat
  await testLockSeat(2, 'testuser');
  
  console.log('Waiting for lock to expire (this will take 60+ seconds)...');
  console.log('You can interrupt this test with Ctrl+C and manually test with shorter TTL');
  
  // Wait for slightly more than lock TTL
  await new Promise(resolve => setTimeout(resolve, 62000));
  
  // Try to lock the same seat with different user (should succeed if expired)
  await testLockSeat(2, 'anotheruser');
}

// Error scenarios
async function testErrorScenarios() {
  console.log('\n❌ Testing Error Scenarios...');
  
  // Non-existent seat
  await testLockSeat(999, 'testuser');
  
  // Book seat 3 first
  await testLockSeat(3, 'user1');
  await testConfirmSeat(3, 'user1');
  
  // Try to lock already booked seat
  await testLockSeat(3, 'user2');
  
  // Try to confirm without lock
  await testConfirmSeat(4, 'user3');
  
  // Try to confirm with wrong user
  await testLockSeat(5, 'user1');
  await testConfirmSeat(5, 'user2');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Seat Booking System Tests\n');
  console.log('Make sure your server is running on http://localhost:3000\n');
  
  try {
    await testGetSeats();
    await testConcurrentBooking();
    await testErrorScenarios();
    
    console.log('\n✅ Basic tests completed!');
    console.log('\n⚠️  To test lock expiration (60s timeout), run: node test.js --expiration');
    console.log('Or modify LOCK_TTL in server.js to a smaller value like 5000ms for quicker testing');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check for expiration test flag
if (process.argv.includes('--expiration')) {
  testLockExpiration();
} else {
  runAllTests();
}