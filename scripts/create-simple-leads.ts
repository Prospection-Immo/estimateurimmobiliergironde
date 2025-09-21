import { supabaseAdmin } from '../server/lib/supabaseAdmin';

// Leads simplifiés avec colonnes de base seulement
const simpleLeads = [
  {
    email: 'marie.dupont@gmail.com',
    first_name: 'Marie',
    last_name: 'Dupont',
    city: 'Mérignac',
    source: 'estimation-immobilier-gironde.fr'
  },
  {
    email: 'pierre.martin@outlook.fr',  
    first_name: 'Pierre',
    last_name: 'Martin',
    city: 'Bordeaux',
    source: 'estimation-immobilier-gironde.fr'
  },
  {
    email: 'sophie.bernard@yahoo.fr',
    first_name: 'Sophie', 
    last_name: 'Bernard',
    city: 'Arcachon',
    source: 'estimation-immobilier-gironde.fr'
  },
  {
    email: 'julien.rousseau@gmail.com',
    first_name: 'Julien',
    last_name: 'Rousseau', 
    source: 'estimation-immobilier-gironde.fr'
  }
];

async function createSimpleLeads() {
  console.log('🚀 Création leads simplifiés...');
  
  try {
    // Vérifier leads existants
    const { data: existingLeads } = await supabaseAdmin
      .from('leads')
      .select('email');
    
    const existingEmails = new Set(existingLeads?.map(l => l.email) || []);
    console.log(`📊 ${existingLeads?.length || 0} lead(s) existant(s)`);
    
    let createdCount = 0;
    
    for (const lead of simpleLeads) {
      try {
        if (existingEmails.has(lead.email)) {
          console.log(`⚠️ Lead "${lead.email}" existe déjà`);
          continue;
        }
        
        const { error } = await supabaseAdmin
          .from('leads')
          .insert(lead);
        
        if (error) {
          console.error(`❌ Erreur lead "${lead.email}":`, error);
        } else {
          console.log(`✅ Lead "${lead.email}" créé`);
          createdCount++;
        }
        
      } catch (error) {
        console.error(`💥 Erreur "${lead.email}":`, error);
      }
    }
    
    console.log(`\n🎉 ${createdCount} lead(s) créé(s) !`);
    
    // Vérifier la structure finale
    const { data: finalLeads } = await supabaseAdmin
      .from('leads')
      .select('*')
      .limit(1);
    
    if (finalLeads && finalLeads.length > 0) {
      console.log('\n🔍 Structure table leads :');
      console.log(Object.keys(finalLeads[0]));
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

// Exécution automatique
createSimpleLeads()
  .then(() => {
    console.log('\n🏁 Création leads terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { createSimpleLeads };