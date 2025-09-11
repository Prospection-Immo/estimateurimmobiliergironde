import { createOptimizedEmailTemplates, checkEmailTemplatesStatus } from './services/createEmailTemplates';

async function setupEmailTemplates() {
  console.log('🚀 Setting up optimized email templates with magic words...');
  
  try {
    // Check current status
    await checkEmailTemplatesStatus();
    
    // Create all optimized templates
    await createOptimizedEmailTemplates();
    
    // Check status after creation
    console.log('\n📊 Final status after template creation:');
    await checkEmailTemplatesStatus();
    
    console.log('\n✅ Email template optimization completed successfully!');
    console.log('🎯 All templates now include the 9 conversion-focused magic words:');
    console.log('   1. Vous - personalization');
    console.log('   2. Nouveau - novelty');
    console.log('   3. Solution - problem-solving');
    console.log('   4. Gagner - opportunity');
    console.log('   5. Garantie - trust/guarantee');
    console.log('   6. Économie - savings');
    console.log('   7. Exclusif - exclusivity');
    console.log('   8. Gratuit - free');
    console.log('   9. Résultat - concrete results');
    
  } catch (error) {
    console.error('❌ Error setting up email templates:', error);
    process.exit(1);
  }
}

// Run the setup
setupEmailTemplates();