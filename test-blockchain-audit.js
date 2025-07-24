/**
 * Blockchain Audit Chain Test Script
 * 
 * Tests the blockchain audit chain functionality including:
 * - Adding audit records
 * - Chain verification
 * - Block mining
 * - Data integrity
 */

const { blockchainAuditChain } = require('./src/services/BlockchainAuditChain');

// Mock executive data for testing
const mockExecutives = [
  {
    id: 'executive-1',
    name: 'Marcus Chen',
    role: 'CEO',
    currentActivity: 'analysis'
  },
  {
    id: 'executive-2', 
    name: 'Sarah Johnson',
    role: 'CFO',
    currentActivity: 'crm'
  },
  {
    id: 'executive-3',
    name: 'David Rodriguez',
    role: 'CTO',
    currentActivity: 'meeting'
  }
];

// Mock executive actions for testing
const mockActions = [
  {
    id: 'action-1',
    type: 'email_send',
    description: 'Sent quarterly report to stakeholders',
    value: 50000,
    riskLevel: 'medium',
    requiredApproval: true
  },
  {
    id: 'action-2',
    type: 'deal_advance',
    description: 'Advanced deal with TechCorp Inc',
    value: 250000,
    riskLevel: 'high',
    requiredApproval: true
  },
  {
    id: 'action-3',
    type: 'expense_approve',
    description: 'Approved marketing budget increase',
    value: 15000,
    riskLevel: 'low',
    requiredApproval: false
  },
  {
    id: 'action-4',
    type: 'contract_sign',
    description: 'Signed partnership agreement',
    value: 1000000,
    riskLevel: 'critical',
    requiredApproval: true
  }
];

async function testBlockchainAuditChain() {
  console.log('🚀 Starting Blockchain Audit Chain Tests...\n');

  try {
    // Test 1: Add audit records
    console.log('📝 Test 1: Adding audit records...');
    const recordIds = [];
    
    for (let i = 0; i < mockExecutives.length; i++) {
      const executive = mockExecutives[i];
      const action = mockActions[i % mockActions.length];
      
      const recordId = blockchainAuditChain.addAuditRecord(
        executive,
        action,
        { testContext: `Test context ${i + 1}` }
      );
      
      recordIds.push(recordId);
      console.log(`✅ Added audit record ${recordId} for ${executive.name}`);
    }

    // Test 2: Wait for mining to complete
    console.log('\n⛏️ Test 2: Waiting for block mining...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for mining

    // Test 3: Verify chain integrity
    console.log('\n🔍 Test 3: Verifying chain integrity...');
    const verification = blockchainAuditChain.verifyChain();
    console.log(`Chain valid: ${verification.isValid}`);
    if (!verification.isValid) {
      console.log('Errors:', verification.errors);
    }

    // Test 4: Get chain statistics
    console.log('\n📊 Test 4: Getting chain statistics...');
    const stats = blockchainAuditChain.getChainStats();
    console.log('Chain Stats:', {
      totalBlocks: stats.totalBlocks,
      totalRecords: stats.totalRecords,
      chainLength: stats.chainLength,
      verificationStatus: stats.verificationStatus
    });

    // Test 5: Get executive audit records
    console.log('\n👤 Test 5: Getting executive audit records...');
    const executiveRecords = blockchainAuditChain.getExecutiveAuditRecords('executive-1');
    console.log(`Found ${executiveRecords.length} records for executive-1`);

    // Test 6: Get records by time range
    console.log('\n⏰ Test 6: Getting records by time range...');
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const timeRangeRecords = blockchainAuditChain.getAuditRecordsByTimeRange(oneHourAgo, now);
    console.log(`Found ${timeRangeRecords.length} records in the last hour`);

    // Test 7: Export and import chain
    console.log('\n💾 Test 7: Testing export/import functionality...');
    const exportedChain = blockchainAuditChain.exportChain();
    console.log(`Exported chain length: ${exportedChain.length} characters`);
    
    const importSuccess = blockchainAuditChain.importChain(exportedChain);
    console.log(`Import successful: ${importSuccess}`);

    // Test 8: Add more records to test mining
    console.log('\n📝 Test 8: Adding more records to test mining...');
    for (let i = 0; i < 5; i++) {
      const executive = mockExecutives[i % mockExecutives.length];
      const action = mockActions[i % mockActions.length];
      
      blockchainAuditChain.addAuditRecord(
        executive,
        action,
        { additionalTest: `Additional test ${i + 1}` }
      );
    }

    // Test 9: Final verification
    console.log('\n🔍 Test 9: Final chain verification...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for mining
    
    const finalVerification = blockchainAuditChain.verifyChain();
    const finalStats = blockchainAuditChain.getChainStats();
    
    console.log(`Final chain valid: ${finalVerification.isValid}`);
    console.log('Final stats:', {
      totalBlocks: finalStats.totalBlocks,
      totalRecords: finalStats.totalRecords,
      verifiedRecords: finalStats.verificationStatus.verified,
      pendingRecords: finalStats.verificationStatus.pending
    });

    console.log('\n✅ All blockchain audit chain tests completed successfully!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`- Added ${recordIds.length} initial audit records`);
    console.log(`- Chain integrity: ${verification.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`- Total blocks: ${finalStats.totalBlocks}`);
    console.log(`- Total records: ${finalStats.totalRecords}`);
    console.log(`- Verified records: ${finalStats.verificationStatus.verified}`);
    console.log(`- Pending records: ${finalStats.verificationStatus.pending}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Performance test
async function testPerformance() {
  console.log('\n⚡ Performance Test: Adding 100 records...');
  const startTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const executive = mockExecutives[i % mockExecutives.length];
    const action = mockActions[i % mockActions.length];
    
    blockchainAuditChain.addAuditRecord(
      executive,
      action,
      { performanceTest: `Performance test ${i + 1}` }
    );
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`✅ Added 100 records in ${duration}ms (${(100 / duration * 1000).toFixed(2)} records/second)`);
}

// Run tests
if (require.main === module) {
  testBlockchainAuditChain()
    .then(() => testPerformance())
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testBlockchainAuditChain,
  testPerformance
}; 