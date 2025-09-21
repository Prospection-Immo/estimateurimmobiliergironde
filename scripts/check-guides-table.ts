import { supabaseAdmin } from '../server/lib/supabaseAdmin';

async function checkGuidesTable() {
  try {
    console.log('🔍 Vérification de la table guides dans Supabase...');
    
    // Test simple pour voir si la table existe
    const { data, error } = await supabaseAdmin
      .from('guides')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur table guides:', error);
      console.log('\n📋 Création de la table guides nécessaire...');
      await createGuidesTable();
    } else {
      console.log('✅ Table guides existe !');
      console.log('📊 Nombre de guides:', data?.length || 0);
    }
  } catch (error) {
    console.error('💥 Erreur:', error);
  }
}

async function createGuidesTable() {
  try {
    console.log('🛠️ Création de la table guides...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS guides (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        persona TEXT NOT NULL,
        short_benefit TEXT NOT NULL,
        reading_time INTEGER NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        pdf_content TEXT,
        image_url TEXT,
        meta_description TEXT,
        seo_title TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `;
    
    // Pour créer la table, on peut utiliser une fonction RPC ou l'admin SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Erreur création table:', error);
      console.log('💡 Créez manuellement la table guides via l\'interface Supabase.');
    } else {
      console.log('✅ Table guides créée avec succès !');
    }
  } catch (error) {
    console.error('💥 Erreur création:', error);
    console.log('💡 Créez manuellement la table guides via l\'interface Supabase.');
  }
}

// Execute automatically
checkGuidesTable()
  .then(() => {
    console.log('🏁 Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { checkGuidesTable, createGuidesTable };