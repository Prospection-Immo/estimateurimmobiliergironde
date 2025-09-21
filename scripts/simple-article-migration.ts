#!/usr/bin/env tsx

/**
 * Migration simplifiée des articles vers Supabase
 * Utilise seulement les colonnes qui existent réellement
 */

import fs from 'fs';
import { supabaseAdmin } from '../server/lib/supabaseAdmin';

interface SourceArticle {
  id?: string;
  title: string;
  slug: string;
  metaDescription?: string;
  content: string;
  summary?: string;
  keywords?: string;
  seoTitle?: string;
  authorName?: string;
  status?: string;
  category?: string;
  publishedAt?: string;
  scheduledFor?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

const CONFIG = {
  SOURCE_FILE: '../created-articles.json',
  DRY_RUN: process.argv.includes('--dry-run'),
  BATCH_SIZE: 10
};

async function detectTableColumns(): Promise<string[]> {
  console.log('🔍 Détection des colonnes disponibles...');
  
  // Test avec un article minimal pour voir les colonnes obligatoires
  const testArticle = {
    title: 'Test Structure',
    slug: 'test-structure-' + Date.now(),
    content: 'Test content for structure detection'
  };
  
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert([testArticle])
      .select();
    
    if (!error && data?.[0]) {
      const columns = Object.keys(data[0]);
      console.log('✅ Colonnes détectées:', columns);
      
      // Supprimer l'article de test
      await supabaseAdmin
        .from('articles')
        .delete()
        .eq('slug', testArticle.slug);
      
      return columns;
    } else {
      console.error('❌ Erreur détection:', error?.message);
      // Colonnes minimales par défaut
      return ['id', 'title', 'slug', 'content'];
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    return ['id', 'title', 'slug', 'content'];
  }
}

function createArticleForColumns(source: SourceArticle, availableColumns: string[]): any {
  const article: any = {};
  
  // Mapping des champs source vers les colonnes disponibles
  const fieldMapping: Record<string, any> = {
    'title': source.title?.trim(),
    'slug': source.slug?.toLowerCase().trim(),
    'content': source.content?.trim(),
    'meta_description': source.metaDescription?.trim(),
    'summary': source.summary?.trim(),
    'keywords': source.keywords,
    'seo_title': source.seoTitle?.trim(),
    'author_name': source.authorName?.trim() || 'Expert Immobilier',
    'status': source.status || 'published',
    'category': source.category || 'estimation',
    'published_at': source.publishedAt ? new Date(source.publishedAt).toISOString() : new Date().toISOString(),
    'scheduled_for': source.scheduledFor ? new Date(source.scheduledFor).toISOString() : null
  };
  
  // Ajouter seulement les colonnes qui existent
  for (const column of availableColumns) {
    if (fieldMapping.hasOwnProperty(column)) {
      article[column] = fieldMapping[column];
    }
  }
  
  // S'assurer que les champs obligatoires sont présents
  if (!article.title || !article.slug || !article.content) {
    throw new Error('Champs obligatoires manquants');
  }
  
  return article;
}

async function migrateArticles(): Promise<void> {
  console.log('🚀 === MIGRATION ARTICLES SIMPLIFIÉE ===\n');
  
  // Étape 1: Détecter les colonnes disponibles
  const availableColumns = await detectTableColumns();
  console.log(`📋 Colonnes utilisables: ${availableColumns.join(', ')}\n`);
  
  // Étape 2: Charger les articles source
  console.log('📖 Chargement des articles source...');
  const rawData = fs.readFileSync(CONFIG.SOURCE_FILE, 'utf-8');
  const sourceArticles = JSON.parse(rawData) as SourceArticle[];
  console.log(`✅ ${sourceArticles.length} articles trouvés\n`);
  
  // Étape 3: Traitement et migration
  let inserted = 0;
  let errors = 0;
  
  console.log('🔄 Migration en cours...');
  
  for (let i = 0; i < sourceArticles.length; i++) {
    const source = sourceArticles[i];
    
    try {
      // Créer l'article avec les colonnes disponibles
      const article = createArticleForColumns(source, availableColumns);
      
      if (CONFIG.DRY_RUN) {
        console.log(`📝 [DRY-RUN] Article ${i + 1}: "${article.title}"`);
        inserted++;
      } else {
        // Vérifier si l'article existe déjà
        const { data: existing } = await supabaseAdmin
          .from('articles')
          .select('id')
          .eq('slug', article.slug)
          .limit(1);
        
        if (existing && existing.length > 0) {
          console.log(`⏭️ Article existant ignoré: "${article.title}"`);
          continue;
        }
        
        // Insérer l'article
        const { error } = await supabaseAdmin
          .from('articles')
          .insert([article]);
        
        if (error) {
          console.error(`❌ Erreur insertion "${article.title}":`, error.message);
          errors++;
        } else {
          console.log(`✅ Article inséré: "${article.title}"`);
          inserted++;
        }
      }
      
      // Petite pause tous les 10 articles
      if (i % CONFIG.BATCH_SIZE === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`❌ Erreur traitement "${source.title}":`, error);
      errors++;
    }
  }
  
  // Résumé final
  console.log('\n🎯 === RÉSUMÉ FINAL ===');
  console.log(`📊 Total traité: ${sourceArticles.length}`);
  console.log(`✅ Insérés: ${inserted}`);
  console.log(`❌ Erreurs: ${errors}`);
  
  if (CONFIG.DRY_RUN) {
    console.log('\n🔍 Migration simulée terminée (DRY-RUN)');
    console.log('💡 Relancez sans --dry-run pour effectuer la migration réelle');
  } else {
    console.log('\n🎉 Migration terminée !');
    console.log('🔗 Vérifiez votre dashboard Supabase');
  }
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateArticles().catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}