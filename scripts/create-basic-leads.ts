import { supabaseAdmin } from '../server/lib/supabaseAdmin';

// Leads avec champs obligatoires minimum
const basicLeads = [
  {
    email: 'marie.dupont@gmail.com',
    first_name: 'Marie',
    last_name: 'Dupont',
    property_type: 'house', // OBLIGATOIRE
    city: 'Mérignac',
    source: 'estimation-immobilier-gironde.fr'
  },
  {
    email: 'pierre.martin@outlook.fr',  
    first_name: 'Pierre',
    last_name: 'Martin',
    property_type: 'apartment', // OBLIGATOIRE
    city: 'Bordeaux',
    source: 'estimation-immobilier-gironde.fr'
  },
  {
    email: 'sophie.bernard@yahoo.fr',
    first_name: 'Sophie', 
    last_name: 'Bernard',
    property_type: 'house', // OBLIGATOIRE
    city: 'Arcachon',
    source: 'estimation-immobilier-gironde.fr'
  },
  {
    email: 'julien.rousseau@gmail.com',
    first_name: 'Julien',
    last_name: 'Rousseau',
    property_type: 'apartment', // OBLIGATOIRE 
    source: 'estimation-immobilier-gironde.fr'
  }
];

async function createBasicLeads() {
  console.log('🚀 Création leads avec champs obligatoires...');
  
  try {
    let createdCount = 0;
    
    for (const lead of basicLeads) {
      try {
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
    
    // Compter total leads
    const { data: totalLeads } = await supabaseAdmin
      .from('leads')
      .select('email');
    
    console.log(`📊 Total leads Supabase: ${totalLeads?.length || 0}`);
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

// Exécution automatique
createBasicLeads()
  .then(() => {
    console.log('\n🏁 Création leads terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { createBasicLeads };