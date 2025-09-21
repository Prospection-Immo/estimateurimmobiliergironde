import { supabaseAdmin } from '../server/lib/supabaseAdmin';

async function testGuidesSchema() {
  try {
    console.log('🔍 Test du schéma table guides...');
    
    // Test avec un guide minimal
    const minimalGuide = {
      title: "Test Guide Schema",
      slug: "test-guide-schema",
      persona: "presse",
      short_benefit: "Test des colonnes disponibles",
      reading_time: 10,
      content: "Contenu de test"
    };
    
    console.log('📝 Tentative insertion guide minimal...');
    
    const { data, error } = await supabaseAdmin
      .from('guides')
      .insert(minimalGuide)
      .select();
    
    if (error) {
      console.error('❌ Erreur insertion:', error);
      console.log('\n🔍 Essayons de voir le schéma via une sélection...');
      
      // Essayer de voir les colonnes via une sélection
      const { data: schemaTest, error: selectError } = await supabaseAdmin
        .from('guides')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.error('❌ Erreur sélection:', selectError);
      } else {
        console.log('✅ Sélection réussie, schéma fonctionnel');
      }
    } else {
      console.log('✅ Guide minimal créé avec succès:', data);
      
      // Nettoyer le test
      if (data && data[0]) {
        await supabaseAdmin
          .from('guides')
          .delete()
          .eq('slug', 'test-guide-schema');
        console.log('🗑️ Guide de test supprimé');
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  }
}

// Execute automatically
testGuidesSchema()
  .then(() => {
    console.log('🏁 Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { testGuidesSchema };