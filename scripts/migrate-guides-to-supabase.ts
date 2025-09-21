import { db } from '../server/storage';
import { guides } from '../shared/schema';
import { supabaseAdmin } from '../server/lib/supabaseAdmin';
import { toSupabaseGuide } from '../server/lib/guideMapper';

async function migrateGuidesToSupabase() {
  try {
    console.log('🚀 Début de la migration des guides vers Supabase...');
    
    // 1. Extraire les guides de PostgreSQL local
    console.log('📥 Extraction des guides depuis PostgreSQL local...');
    const localGuides = await db.select().from(guides);
    
    console.log(`✅ ${localGuides.length} guide(s) trouvé(s) en local`);
    
    if (localGuides.length === 0) {
      console.log('⚠️ Aucun guide trouvé en local. Migration terminée.');
      return;
    }
    
    // 2. Afficher les guides trouvés
    console.log('\n📋 Guides trouvés :');
    localGuides.forEach((guide, index) => {
      console.log(`  ${index + 1}. ${guide.title} (${guide.persona}) - ${guide.slug}`);
    });
    
    // 3. Vérifier si des guides existent déjà dans Supabase
    console.log('\n🔍 Vérification des guides existants dans Supabase...');
    const { data: existingGuides, error: checkError } = await supabaseAdmin
      .from('guides')
      .select('slug');
    
    if (checkError) {
      console.error('❌ Erreur lors de la vérification Supabase:', checkError);
      return;
    }
    
    const existingSlugs = new Set(existingGuides?.map(g => g.slug) || []);
    console.log(`📊 ${existingGuides?.length || 0} guide(s) déjà en Supabase`);
    
    // 4. Filtrer les guides à migrer (éviter les doublons)
    const guidesToMigrate = localGuides.filter(guide => !existingSlugs.has(guide.slug));
    
    if (guidesToMigrate.length === 0) {
      console.log('✅ Tous les guides sont déjà migrés vers Supabase !');
      return;
    }
    
    console.log(`\n🎯 ${guidesToMigrate.length} guide(s) à migrer`);
    
    // 5. Migration des guides un par un
    let successCount = 0;
    let errorCount = 0;
    
    for (const localGuide of guidesToMigrate) {
      try {
        console.log(`\n📤 Migration: "${localGuide.title}"...`);
        
        // Convertir le format pour Supabase
        const supabaseGuide = toSupabaseGuide(localGuide);
        
        // Insérer dans Supabase
        const { error: insertError } = await supabaseAdmin
          .from('guides')
          .insert(supabaseGuide);
        
        if (insertError) {
          console.error(`❌ Erreur migration "${localGuide.title}":`, insertError);
          errorCount++;
        } else {
          console.log(`✅ "${localGuide.title}" migré avec succès`);
          successCount++;
        }
        
        // Pause entre les insertions pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`💥 Erreur inattendue pour "${localGuide.title}":`, error);
        errorCount++;
      }
    }
    
    // 6. Résumé de la migration
    console.log('\n🏁 Migration terminée !');
    console.log(`✅ Succès: ${successCount} guide(s)`);
    console.log(`❌ Erreurs: ${errorCount} guide(s)`);
    
    if (successCount > 0) {
      console.log('\n🔄 Vérification finale...');
      const { data: finalGuides, error: finalError } = await supabaseAdmin
        .from('guides')
        .select('title, slug, persona')
        .order('created_at', { ascending: false });
      
      if (!finalError && finalGuides) {
        console.log(`📊 Total en Supabase: ${finalGuides.length} guide(s)`);
        console.log('\n📋 Guides dans Supabase :');
        finalGuides.forEach((guide, index) => {
          console.log(`  ${index + 1}. ${guide.title} (${guide.persona}) - ${guide.slug}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale lors de la migration:', error);
    process.exit(1);
  }
}

// Execute automatically
migrateGuidesToSupabase()
  .then(() => {
    console.log('\n🎉 Migration terminée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { migrateGuidesToSupabase };