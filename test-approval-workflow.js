// Simple test to verify email approval workflow
const { EmailApprovalService } = require('./src/services/EmailApprovalService.ts');

// Test high-stakes email detection
const testEmailDraft = {
  id: 'test-1',
  from: 'ceo@sovren.ai',
  to: ['board@company.com', 'legal@company.com'],
  subject: 'URGENT: Contract Amendment Required - $2.5M Deal',
  body: 'We need to execute an amendment to the Acme Corp contract immediately. The deal value has increased to $2.5 million and includes additional intellectual property licensing terms. Please review the attached legal documents and authorize the signing. This is time-sensitive as the deadline is tomorrow.',
  executiveId: 'ceo'
};

console.log('Testing Email Approval Workflow...');
console.log('=================================');

try {
  const approvalService = EmailApprovalService.getInstance();
  const result = approvalService.detectHighStakesEmail(testEmailDraft);
  
  console.log('Email Draft:');
  console.log('Subject:', testEmailDraft.subject);
  console.log('To:', testEmailDraft.to.join(', '));
  console.log('Body:', testEmailDraft.body.substring(0, 100) + '...');
  console.log('');
  
  console.log('Detection Results:');
  console.log('Is High Stakes:', result.isHighStakes);
  console.log('Requires Approval:', result.requiresApproval);
  console.log('Risk Level:', result.riskLevel);
  console.log('Reason:', result.reason);
  console.log('');
  
  if (result.requiresApproval) {
    const executive = { id: 'ceo', name: 'CEO', role: 'CEO' };
    const approvalRequest = approvalService.createApprovalRequest(
      testEmailDraft,
      executive,
      result.riskLevel
    );
    
    console.log('Approval Request Created:');
    console.log('ID:', approvalRequest.id);
    console.log('Action:', approvalRequest.action.description);
    console.log('Estimated Value:', approvalRequest.estimatedValue);
    console.log('Risk Level:', approvalRequest.riskLevel);
    console.log('Business Impact:', approvalRequest.context.businessImpact);
    console.log('');
    
    console.log('✅ Email approval workflow is working correctly!');
  } else {
    console.log('❌ Email should have required approval but did not.');
  }
  
} catch (error) {
  console.error('❌ Error testing approval workflow:', error.message);
}