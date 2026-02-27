// Test script for Observer Protocol SDK
const { ObserverProtocol } = require('./index.js');

async function runTests() {
  console.log('🧪 Observer Protocol SDK Test Suite\n');
  
  const observer = new ObserverProtocol();
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: API Connectivity
  console.log('Test 1: API Connectivity (getTrends)');
  try {
    const trends = await observer.getTrends();
    console.log('  ✅ API is reachable');
    console.log(`  📊 ${trends.total_events} events, ${trends.total_verified_agents} verified agents`);
    testsPassed++;
  } catch (e) {
    console.log('  ❌ API unreachable:', e.message);
    testsFailed++;
  }
  
  // Test 2: Register agent
  console.log('\nTest 2: Agent Registration');
  let agentId;
  try {
    const agent = await observer.registerAgent({
      publicKey: '03' + Math.random().toString(36).substring(2, 34),
      alias: 'TestAgent-' + Date.now(),
      lightningNodePubkey: '03testnode'
    });
    agentId = agent.id;
    console.log('  ✅ Agent registered:', agent.id.substring(0, 16) + '...');
    console.log('  🏷️  Badge URL:', agent.badge_url);
    testsPassed++;
  } catch (e) {
    console.log('  ❌ Registration failed:', e.message);
    testsFailed++;
  }
  
  // Test 3: Get reputation for new agent
  console.log('\nTest 3: Get Reputation (new agent)');
  if (agentId) {
    try {
      const rep = await observer.getReputation(agentId);
      console.log('  ✅ Reputation fetched');
      console.log(`  📈 Score: ${rep.score}, Transactions: ${rep.transaction_count}`);
      testsPassed++;
    } catch (e) {
      console.log('  ❌ Reputation fetch failed:', e.message);
      testsFailed++;
    }
  } else {
    console.log('  ⚠️  Skipped (no agent ID)');
  }
  
  // Test 4: Get agent profile for maxi-0001
  console.log('\nTest 4: Get Existing Agent Profile (maxi-0001)');
  try {
    const profile = await observer.getAgentProfile('maxi-0001');
    console.log('  ✅ Profile fetched for maxi-0001');
    console.log(`  👤 Name: ${profile.agent_name}, Verified: ${profile.verified}`);
    console.log(`  📊 Tx count: ${profile.verified_tx_count}`);
    testsPassed++;
  } catch (e) {
    console.log('  ❌ Profile fetch failed:', e.message);
    testsFailed++;
  }
  
  // Test 5: Query transactions
  console.log('\nTest 5: Query Transactions (feed)');
  try {
    const txs = await observer.queryTransactions({ limit: 3 });
    console.log('  ✅ Transactions queried:', txs.length, 'results');
    if (txs.length > 0) {
      console.log(`  📋 First tx: ${txs[0].event_type} (${txs[0].protocol})`);
    }
    testsPassed++;
  } catch (e) {
    console.log('  ❌ Query failed:', e.message);
    testsFailed++;
  }
  
  // Test 6: Verify agent (test signature)
  console.log('\nTest 6: Verify Agent');
  if (agentId) {
    try {
      const verified = await observer.verifyAgent(agentId, 'test-challenge', 'test-signature');
      console.log('  ✅ Verification result:', verified.verified);
      testsPassed++;
    } catch (e) {
      console.log('  ❌ Verification failed:', e.message);
      testsFailed++;
    }
  }
  
  // Test 7: Get badge URL
  console.log('\nTest 7: Badge URL Generation');
  try {
    const badgeUrl = observer.getBadgeUrl('maxi-0001');
    console.log('  ✅ Badge URL generated:', badgeUrl.substring(0, 60) + '...');
    testsPassed++;
  } catch (e) {
    console.log('  ❌ Badge URL failed:', e.message);
    testsFailed++;
  }
  
  // Test 8: Get reputation for maxi-0001
  console.log('\nTest 8: Get Reputation (maxi-0001)');
  try {
    const rep = await observer.getReputation('maxi-0001');
    console.log('  ✅ Reputation fetched for maxi-0001');
    console.log(`  📈 Badge level: ${rep.badge_level}, Tx count: ${rep.transaction_count}`);
    testsPassed++;
  } catch (e) {
    console.log('  ❌ Reputation fetch failed:', e.message);
    testsFailed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50));
  
  if (testsFailed === 0) {
    console.log('✅ All SDK functions are working correctly!');
    return true;
  } else {
    console.log('⚠️  Some tests failed - review errors above');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
