#!/usr/bin/env tsx

/**
 * Script de migration des articles vers Supabase
 * Migre les articles de created-articles.json vers la base Supabase
 */

import fs from 'fs';
import { db } from '../server/storage';
import { articles, insertArticleSchema } from '../shared/schema';
import type { InsertArticle } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

interface SourceArticle {
  id?: string;
  title: string;
  slug: string;
  metaDescription?: string;
  content: string;
  summary?: string;
  keywords?: string; // JSON string
  seoTitle?: string;
  authorName?: string;
  status?: string;
  category?: string;
  publishedAt?: string;
  scheduledFor?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

interface MigrationResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ slug: string; error: string; }>;
}

// Configuration du script
const CONFIG = {
  SOURCE_FILE: '../created-articles.json',
  BATCH_SIZE: 50,
  DRY_RUN: process.argv.includes('--dry-run'),
  FORCE: process.argv.includes('--force'),
  VERBOSE: process.argv.includes('--verbose')
};

// Schema de validation plus strict pour la migration
const migrationArticleSchema = insertArticleSchema.extend({
  title: z.string().min(5, 'Le titre doit faire au moins 5 caractères'),
  content: z.string().min(50, 'Le contenu doit faire au moins 50 caractères'),
  slug: z.string().min(3, 'Le slug doit faire au moins 3 caractères'),
});

function validateAndTransformArticle(source: SourceArticle): InsertArticle | null {
  try {
    // Validation de base
    if (!source.title || !source.content || !source.slug) {
      throw new Error('Champs obligatoires manquants');
    }

    // Transformation des données
    const article: InsertArticle = {
      title: source.title.trim(),
      slug: source.slug.toLowerCase().trim(),
      content: source.content.trim(),
      metaDescription: source.metaDescription?.trim() || undefined,
      summary: source.summary?.trim() || undefined,
      keywords: source.keywords || undefined,
      seoTitle: source.seoTitle?.trim() || undefined,
      authorName: source.authorName?.trim() || 'Expert Immobilier',
      status: (source.status as any) || 'published',
      category: source.category || 'estimation',
      publishedAt: source.publishedAt ? new Date(source.publishedAt) : new Date(),
      scheduledFor: source.scheduledFor ? new Date(source.scheduledFor) : undefined,
    };

    // Validation stricte
    const validatedArticle = migrationArticleSchema.parse(article);
    
    return validatedArticle;
  } catch (error) {
    if (CONFIG.VERBOSE) {
      console.error(`❌ Validation échouée pour "${source.title}":`, error);
    }
    return null;
  }
}

async function checkExistingArticle(slug: string): Promise<boolean> {
  try {
    const existing = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
    return existing.length > 0;
  } catch (error) {
    console.warn(`⚠️ Erreur vérification article existant ${slug}:`, error);
    return false;
  }
}

async function insertOrUpdateArticle(article: InsertArticle, isUpdate: boolean): Promise<boolean> {
  try {
    if (CONFIG.DRY_RUN) {
      console.log(`📝 [DRY-RUN] ${isUpdate ? 'Mettre à jour' : 'Insérer'} article: "${article.title}"`);
      return true;
    }

    if (isUpdate) {
      // Mise à jour basée sur le slug
      await db.update(articles)
        .set({
          ...article,
          updatedAt: new Date()
        })
        .where(eq(articles.slug, article.slug));
    } else {
      // Insertion
      await db.insert(articles).values(article);
    }

    return true;
  } catch (error) {
    console.error(`❌ Erreur ${isUpdate ? 'mise à jour' : 'insertion'} article "${article.title}":`, error);
    return false;
  }
}

async function migrateArticlesBatch(batch: InsertArticle[]): Promise<Partial<MigrationResult>> {
  const result: Partial<MigrationResult> = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  for (const article of batch) {
    try {
      const exists = await checkExistingArticle(article.slug);
      
      if (exists && !CONFIG.FORCE) {
        result.skipped = (result.skipped || 0) + 1;
        if (CONFIG.VERBOSE) {
          console.log(`⏭️ Article existant ignoré: "${article.title}"`);
        }
        continue;
      }

      const success = await insertOrUpdateArticle(article, exists);
      
      if (success) {
        if (exists) {
          result.updated = (result.updated || 0) + 1;
          console.log(`🔄 Article mis à jour: "${article.title}"`);
        } else {
          result.inserted = (result.inserted || 0) + 1;
          console.log(`✅ Article inséré: "${article.title}"`);
        }
      } else {
        result.errors?.push({
          slug: article.slug,
          error: 'Échec insertion/mise à jour'
        });
      }
    } catch (error) {
      result.errors?.push({
        slug: article.slug,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  return result;
}

async function loadSourceArticles(): Promise<SourceArticle[]> {
  try {
    if (!fs.existsSync(CONFIG.SOURCE_FILE)) {
      throw new Error(`Fichier source non trouvé: ${CONFIG.SOURCE_FILE}`);
    }

    const rawData = fs.readFileSync(CONFIG.SOURCE_FILE, 'utf-8');
    const articles = JSON.parse(rawData) as SourceArticle[];
    
    if (!Array.isArray(articles)) {
      throw new Error('Le fichier source doit contenir un tableau d\'articles');
    }

    console.log(`📖 ${articles.length} articles trouvés dans ${CONFIG.SOURCE_FILE}`);
    return articles;
  } catch (error) {
    console.error('❌ Erreur lecture fichier source:', error);
    process.exit(1);
  }
}

function createBatches<T>(array: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

async function showPreMigrationSummary(validArticles: InsertArticle[]): Promise<void> {
  console.log('\n📊 === RÉSUMÉ PRÉ-MIGRATION ===');
  
  // Statistiques par catégorie
  const categories = validArticles.reduce((acc, article) => {
    acc[article.category || 'non définie'] = (acc[article.category || 'non définie'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Statistiques par statut
  const statuses = validArticles.reduce((acc, article) => {
    acc[article.status || 'non défini'] = (acc[article.status || 'non défini'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`📋 Articles valides: ${validArticles.length}`);
  console.log('📂 Par catégorie:', categories);
  console.log('📊 Par statut:', statuses);
  
  if (CONFIG.DRY_RUN) {
    console.log('\n🔍 MODE DRY-RUN: Aucune modification ne sera effectuée');
  }
  
  if (CONFIG.FORCE) {
    console.log('\n⚡ MODE FORCE: Les articles existants seront mis à jour');
  }
}

async function main(): Promise<void> {
  console.log('🚀 === MIGRATION ARTICLES VERS SUPABASE ===\n');
  
  // Chargement des articles source
  const sourceArticles = await loadSourceArticles();
  
  // Validation et transformation
  console.log('🔍 Validation et transformation des articles...');
  const validArticles: InsertArticle[] = [];
  const invalidCount = [];
  
  for (const source of sourceArticles) {
    const validated = validateAndTransformArticle(source);
    if (validated) {
      validArticles.push(validated);
    } else {
      invalidCount.push(source.slug || source.title);
    }
  }
  
  console.log(`✅ ${validArticles.length} articles valides`);
  if (invalidCount.length > 0) {
    console.log(`❌ ${invalidCount.length} articles invalides ignorés`);
    if (CONFIG.VERBOSE) {
      console.log('Articles invalides:', invalidCount);
    }
  }
  
  if (validArticles.length === 0) {
    console.log('❌ Aucun article valide à migrer');
    return;
  }

  // Résumé pré-migration
  await showPreMigrationSummary(validArticles);
  
  // Migration par batch
  console.log(`\n🔄 Migration en cours... (${CONFIG.BATCH_SIZE} articles par lot)`);
  const batches = createBatches(validArticles, CONFIG.BATCH_SIZE);
  const globalResult: MigrationResult = {
    total: validArticles.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n📦 Lot ${i + 1}/${batches.length} (${batch.length} articles)`);
    
    const batchResult = await migrateArticlesBatch(batch);
    
    globalResult.inserted += batchResult.inserted || 0;
    globalResult.updated += batchResult.updated || 0;
    globalResult.skipped += batchResult.skipped || 0;
    globalResult.errors.push(...(batchResult.errors || []));
  }
  
  // Résumé final
  console.log('\n🎯 === RÉSUMÉ FINAL ===');
  console.log(`📊 Total traité: ${globalResult.total}`);
  console.log(`✅ Insérés: ${globalResult.inserted}`);
  console.log(`🔄 Mis à jour: ${globalResult.updated}`);
  console.log(`⏭️ Ignorés: ${globalResult.skipped}`);
  console.log(`❌ Erreurs: ${globalResult.errors.length}`);
  
  if (globalResult.errors.length > 0) {
    console.log('\n❌ ERREURS:');
    globalResult.errors.forEach(error => {
      console.log(`  - ${error.slug}: ${error.error}`);
    });
  }
  
  if (CONFIG.DRY_RUN) {
    console.log('\n🔍 Migration simulée terminée (DRY-RUN)');
    console.log('💡 Utilisez le script sans --dry-run pour effectuer la migration réelle');
  } else {
    console.log('\n🎉 Migration terminée avec succès !');
  }
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

export { main as migrateArticlesToSupabase };