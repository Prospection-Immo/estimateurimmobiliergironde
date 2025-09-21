#!/usr/bin/env tsx

/**
 * Script de vérification et synchronisation Supabase
 * Vérifie que l'application utilise bien Supabase et que toutes les tables existent
 */

import { supabase } from '../server/lib/supabaseClient';
import { supabaseAdmin } from '../server/lib/supabaseAdmin';
import { db } from '../server/storage';
import * as schema from '../shared/schema';

const EXPECTED_TABLES = [
  'users',
  'leads', 
  'estimations',
  'contacts',
  'articles',
  'email_templates',
  'email_history',
  'auth_sessions',
  'guides',
  'guide_downloads',
  'guide_analytics',
  'guide_email_sequences',
  'persona_configs',
  'lead_scoring',
  'scoring_config',
  'lead_score_history',
  'sms_campaigns',
  'sms_templates',
  'sms_contacts',
  'sms_sent_messages',
  'sms_sequences',
  'sms_sequence_enrollments',
  'courses',
  'orders',
  'order_items',
  'enrollments',
  'course_events',
  'chat_configurations'
];

interface TableInfo {
  table_name: string;
  table_schema: string;
  table_type: string;
}

async function verifySupabaseConnection(): Promise<boolean> {
  console.log('🔍 Vérification connexion Supabase...');
  
  try {
    // Test client anonyme
    if (!supabase) {
      console.error('❌ Client Supabase anonyme non disponible');
      return false;
    }

    const { data: healthCheck, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erreur connexion Supabase:', error.message);
      return false;
    }

    console.log('✅ Connexion Supabase client anonyme OK');

    // Test client admin
    if (!supabaseAdmin) {
      console.warn('⚠️ Client Supabase admin non disponible (optionnel)');
    } else {
      const { data: adminCheck, error: adminError } = await supabaseAdmin
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (adminError) {
        console.warn('⚠️ Erreur connexion Supabase admin:', adminError.message);
      } else {
        console.log('✅ Connexion Supabase client admin OK');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur connexion Supabase:', error);
    return false;
  }
}

async function listSupabaseTables(): Promise<TableInfo[]> {
  console.log('📋 Liste des tables Supabase...');
  
  try {
    const { data: tables, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name, table_schema, table_type')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (error) {
      console.error('❌ Erreur récupération tables:', error.message);
      return [];
    }

    console.log(`✅ ${tables.length} tables trouvées dans Supabase`);
    return tables as TableInfo[];
  } catch (error) {
    console.error('❌ Erreur liste tables:', error);
    return [];
  }
}

async function verifyTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ Table '${tableName}' non trouvée:`, error.message);
      return false;
    }

    console.log(`✅ Table '${tableName}' existe (${data ? 'données disponibles' : 'vide'})`);
    return true;
  } catch (error) {
    console.log(`❌ Erreur vérification table '${tableName}':`, error);
    return false;
  }
}

async function testApplicationDatabase(): Promise<boolean> {
  console.log('🧪 Test connexion base de données application...');
  
  try {
    // Test de requête simple avec l'ORM de l'application
    const leads = await db.select().from(schema.leads).limit(1);
    console.log('✅ Connexion ORM application OK');
    
    const users = await db.select().from(schema.users).limit(1);
    console.log('✅ Table users accessible via ORM');
    
    const estimations = await db.select().from(schema.estimations).limit(1);
    console.log('✅ Table estimations accessible via ORM');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur test base application:', error);
    return false;
  }
}

async function generateSyncReport(): Promise<void> {
  console.log('\n📊 === RAPPORT DE SYNCHRONISATION SUPABASE ===\n');
  
  // 1. Vérification connexions
  const supabaseConnected = await verifySupabaseConnection();
  const appDbConnected = await testApplicationDatabase();
  
  console.log('\n🔗 CONNEXIONS:');
  console.log(`  Supabase API: ${supabaseConnected ? '✅' : '❌'}`);
  console.log(`  Application DB: ${appDbConnected ? '✅' : '❌'}`);
  
  if (!supabaseConnected || !appDbConnected) {
    console.log('\n❌ ERREUR: Connexions défaillantes. Vérifiez vos variables d\'environnement.');
    return;
  }
  
  // 2. Vérification tables
  console.log('\n📋 TABLES:');
  const existingTables = await listSupabaseTables();
  const existingTableNames = existingTables.map(t => t.table_name);
  
  let allTablesExist = true;
  for (const tableName of EXPECTED_TABLES) {
    const exists = existingTableNames.includes(tableName);
    console.log(`  ${tableName}: ${exists ? '✅' : '❌'}`);
    if (!exists) allTablesExist = false;
  }
  
  // 3. Tables supplémentaires
  const extraTables = existingTableNames.filter(name => !EXPECTED_TABLES.includes(name));
  if (extraTables.length > 0) {
    console.log('\n📌 TABLES SUPPLÉMENTAIRES:');
    extraTables.forEach(table => console.log(`  ${table}: ℹ️`));
  }
  
  // 4. Résumé final
  console.log('\n🎯 RÉSUMÉ:');
  if (supabaseConnected && appDbConnected && allTablesExist) {
    console.log('  🎉 SUCCÈS: Votre application utilise 100% Supabase !');
    console.log('  🔄 Synchronisation: COMPLÈTE');
    console.log('  🚀 Status: PRÊT POUR PRODUCTION');
  } else {
    console.log('  ⚠️  ATTENTION: Synchronisation incomplète');
    if (!allTablesExist) {
      console.log('  📝 Action: Exécutez les migrations manquantes');
    }
  }
  
  console.log('\n✅ Rapport terminé.');
}

// Variables d'environnement pour debugging
async function showEnvironmentInfo(): Promise<void> {
  console.log('\n🔧 VARIABLES D\'ENVIRONNEMENT:');
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ configurée' : '❌ manquante'}`);
  console.log(`  VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✅ configurée' : '❌ manquante'}`);
  console.log(`  VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? '✅ configurée' : '❌ manquante'}`);
  console.log(`  SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ configurée' : '❌ manquante'}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ configurée' : '❌ manquante'}`);
  
  if (process.env.DATABASE_URL) {
    const isSupabaseUrl = process.env.DATABASE_URL.includes('supabase.co');
    console.log(`  DATABASE_URL type: ${isSupabaseUrl ? '✅ Supabase' : '⚠️ Autre'}`);
  }
}

// Fonction principale
async function main(): Promise<void> {
  console.log('🚀 SCRIPT DE VÉRIFICATION SUPABASE\n');
  
  await showEnvironmentInfo();
  await generateSyncReport();
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as verifySupabaseSync };