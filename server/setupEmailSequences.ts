import emailTemplateGenerator from './services/emailTemplateGenerator';
import { storage } from './storage';

/**
 * Script de setup pour initialiser les templates d'email de séquences
 */
async function setupEmailSequences() {
  console.log('🚀 Initialisation des séquences email...');
  
  try {
    // Vérifier si des templates existent déjà
    const existingTemplates = await storage.getEmailTemplates();
    const sequenceTemplates = existingTemplates.filter(t => 
      t.category.includes('guide_delivery_') || 
      t.category.includes('tip_') || 
      t.category.includes('case_study_') || 
      t.category.includes('soft_offer_')
    );

    if (sequenceTemplates.length > 0) {
      console.log(`⚠️  ${sequenceTemplates.length} templates de séquence trouvés. Voulez-vous les supprimer et les recréer ? (y/N)`);
      
      // En mode automatique, on supprime et recrée
      console.log('🗑️  Suppression des anciens templates...');
      for (const template of sequenceTemplates) {
        await storage.deleteEmailTemplate(template.id);
      }
    }

    // Générer tous les nouveaux templates
    console.log('📧 Génération des nouveaux templates...');
    const result = await emailTemplateGenerator.generateAllTemplates();

    if (result.success) {
      console.log(`✅ ${result.created} templates créés avec succès !`);
      
      // Afficher la liste des templates créés
      const newTemplates = await storage.getEmailTemplates();
      const sequenceTemplatesNew = newTemplates.filter(t => 
        t.category.includes('guide_delivery_') || 
        t.category.includes('tip_') || 
        t.category.includes('case_study_') || 
        t.category.includes('soft_offer_')
      );

      console.log('\n📋 Templates créés :');
      sequenceTemplatesNew.forEach(template => {
        console.log(`  - ${template.name} (${template.category})`);
      });

    } else {
      console.error(`❌ Erreurs lors de la création : ${result.errors.length}`);
      result.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erreur lors du setup :', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  setupEmailSequences()
    .then(() => {
      console.log('✅ Setup des séquences email terminé !');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur fatale :', error);
      process.exit(1);
    });
}

export { setupEmailSequences };