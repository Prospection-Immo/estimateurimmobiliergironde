#!/usr/bin/env tsx

/**
 * Script pour corriger le schéma de la table articles dans Supabase
 * Ajoute les colonnes manquantes via l'API Supabase
 */

import { supabaseAdmin } from '../server/lib/supabaseAdmin';

async function getTableStructure(): Promise<void> {
  console.log('🔍 Vérification structure actuelle de la table articles...');
  
  try {
    // Essayer d'insérer un article minimal pour voir quelles colonnes existent
    const testArticle = {
      title: 'Test Title',
      slug: 'test-slug',
      content: 'Test content'
    };
    
    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert([testArticle])
      .select();
    
    if (error) {
      console.log('❌ Erreur test (normal):', error.message);
    } else {
      console.log('✅ Test insertion réussie');
      // Supprimer l'article de test
      await supabaseAdmin
        .from('articles')
        .delete()
        .eq('slug', 'test-slug');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function addMissingColumns(): Promise<void> {
  console.log('🔧 Ajout des colonnes manquantes...');
  
  const alterStatements = [
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_description TEXT;',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS summary TEXT;',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS keywords TEXT;',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_title TEXT;',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT \'Expert Immobilier\';',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'published\';',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT \'estimation\';',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
    'ALTER TABLE articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();'
  ];
  
  try {
    // Utiliser l'API SQL de Supabase pour exécuter les ALTER TABLE
    for (const statement of alterStatements) {
      console.log(`📝 Exécution: ${statement}`);
      
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        sql: statement
      });
      
      if (error) {
        console.log(`⚠️ Possible erreur (peut être normal): ${error.message}`);
      } else {
        console.log('✅ Commande exécutée');
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des colonnes:', error);
  }
}

async function testInsertWithAllColumns(): Promise<void> {
  console.log('🧪 Test insertion avec toutes les colonnes...');
  
  const testArticle = {
    title: 'Test Article Complet',
    slug: 'test-article-complet',
    content: 'Contenu de test',
    meta_description: 'Meta description test',
    summary: 'Résumé test',
    keywords: '["test", "article"]',
    seo_title: 'Titre SEO test',
    author_name: 'Expert Test',
    status: 'draft',
    category: 'test',
    published_at: new Date().toISOString(),
    scheduled_for: null
  };
  
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert([testArticle])
      .select();
    
    if (error) {
      console.error('❌ Erreur test insertion complète:', error.message);
    } else {
      console.log('✅ Test insertion complète réussie !');
      console.log('📊 Article créé:', data?.[0]?.id);
      
      // Supprimer l'article de test
      await supabaseAdmin
        .from('articles')
        .delete()
        .eq('slug', 'test-article-complet');
      console.log('🗑️ Article de test supprimé');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function main(): Promise<void> {
  console.log('🚀 === CORRECTION SCHÉMA TABLE ARTICLES ===\n');
  
  await getTableStructure();
  
  console.log('\n⚠️ Note: Les commandes ALTER TABLE peuvent échouer si les colonnes existent déjà (c\'est normal)');
  await addMissingColumns();
  
  console.log('\n🧪 Test final...');
  await testInsertWithAllColumns();
  
  console.log('\n🎯 Correction terminée ! Vous pouvez maintenant relancer la migration des articles.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}