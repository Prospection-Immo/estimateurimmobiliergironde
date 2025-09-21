import { supabaseAdmin } from '../server/lib/supabaseAdmin';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

// Script de migration CRITIQUE : PostgreSQL local → Supabase
// SAUVEGARDE toutes les données avant suppression Neon

interface MigrationStats {
  users: { existing: number; migrated: number; errors: number };
  leads: { existing: number; migrated: number; errors: number };
  estimations: { existing: number; migrated: number; errors: number };
  contacts: { existing: number; migrated: number; errors: number };
  email_templates: { existing: number; migrated: number; errors: number };
}

// Configuration base locale (à adapter si nécessaire)
const LOCAL_DB_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

async function connectToLocalDB() {
  if (!LOCAL_DB_URL) {
    throw new Error('❌ DATABASE_URL non configurée - impossible d\'accéder aux données locales');
  }
  
  try {
    const localDb = postgres(LOCAL_DB_URL, { ssl: 'prefer' });
    console.log('✅ Connexion base locale réussie');
    return localDb;
  } catch (error) {
    console.error('❌ Erreur connexion base locale:', error);
    throw error;
  }
}

async function migrateUsers(localDb: postgres.Sql, stats: MigrationStats) {
  console.log('\n🔄 Migration table USERS...');
  
  try {
    // Récupérer les users locaux
    const localUsers = await localDb`SELECT * FROM users ORDER BY created_at DESC`;
    stats.users.existing = localUsers.length;
    console.log(`📊 ${localUsers.length} user(s) trouvé(s) en local`);
    
    if (localUsers.length === 0) {
      console.log('ℹ️ Aucun user à migrer');
      return;
    }
    
    // Vérifier users existants Supabase
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('username');
    
    const existingUsernames = new Set(existingUsers?.map(u => u.username) || []);
    
    // Migrer chaque user
    for (const user of localUsers) {
      try {
        if (existingUsernames.has(user.username)) {
          console.log(`⚠️ User "${user.username}" existe déjà - ignoré`);
          continue;
        }
        
        const userToMigrate = {
          id: user.id,
          username: user.username,
          password: user.password, // Hash déjà stocké
          role: user.role || 'admin',
          created_at: user.created_at
        };
        
        const { error } = await supabaseAdmin
          .from('users')
          .insert(userToMigrate);
        
        if (error) {
          console.error(`❌ Erreur migration user "${user.username}":`, error);
          stats.users.errors++;
        } else {
          console.log(`✅ User "${user.username}" migré`);
          stats.users.migrated++;
        }
        
      } catch (error) {
        console.error(`💥 Erreur user "${user.username}":`, error);
        stats.users.errors++;
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur migration users:', error);
    stats.users.errors = stats.users.existing;
  }
}

async function migrateLeads(localDb: postgres.Sql, stats: MigrationStats) {
  console.log('\n🔄 Migration table LEADS...');
  
  try {
    // Récupérer les leads locaux
    const localLeads = await localDb`SELECT * FROM leads ORDER BY created_at DESC`;
    stats.leads.existing = localLeads.length;
    console.log(`📊 ${localLeads.length} lead(s) trouvé(s) en local`);
    
    if (localLeads.length === 0) {
      console.log('ℹ️ Aucun lead à migrer');
      return;
    }
    
    // Vérifier leads existants Supabase
    const { data: existingLeads } = await supabaseAdmin
      .from('leads')
      .select('id');
    
    const existingLeadIds = new Set(existingLeads?.map(l => l.id) || []);
    
    // Migrer par batch de 10 pour éviter timeout
    const BATCH_SIZE = 10;
    for (let i = 0; i < localLeads.length; i += BATCH_SIZE) {
      const batch = localLeads.slice(i, i + BATCH_SIZE);
      
      for (const lead of batch) {
        try {
          if (existingLeadIds.has(lead.id)) {
            console.log(`⚠️ Lead "${lead.email}" existe déjà - ignoré`);
            continue;
          }
          
          // Mapper tous les champs leads selon le schéma
          const leadToMigrate = {
            id: lead.id,
            email: lead.email,
            phone: lead.phone,
            first_name: lead.first_name,
            last_name: lead.last_name,
            property_type: lead.property_type,
            address: lead.address,
            city: lead.city,
            postal_code: lead.postal_code,
            surface: lead.surface,
            rooms: lead.rooms,
            bedrooms: lead.bedrooms,
            bathrooms: lead.bathrooms,
            has_garden: lead.has_garden || false,
            has_parking: lead.has_parking || false,
            has_balcony: lead.has_balcony || false,
            construction_year: lead.construction_year,
            sale_timeline: lead.sale_timeline || '6m',
            wants_expert_contact: lead.wants_expert_contact || false,
            estimated_value: lead.estimated_value,
            project_type: lead.project_type,
            timeline: lead.timeline,
            ownership_status: lead.ownership_status,
            financing_project_type: lead.financing_project_type,
            project_amount: lead.project_amount,
            source: lead.source,
            lead_type: lead.lead_type || 'estimation_quick',
            status: lead.status || 'new',
            consent_at: lead.consent_at,
            consent_source: lead.consent_source,
            ip_address: lead.ip_address,
            guide_slug: lead.guide_slug,
            notes: lead.notes,
            created_at: lead.created_at
          };
          
          const { error } = await supabaseAdmin
            .from('leads')
            .insert(leadToMigrate);
          
          if (error) {
            console.error(`❌ Erreur migration lead "${lead.email}":`, error);
            stats.leads.errors++;
          } else {
            console.log(`✅ Lead "${lead.email}" migré`);
            stats.leads.migrated++;
          }
          
        } catch (error) {
          console.error(`💥 Erreur lead "${lead.email}":`, error);
          stats.leads.errors++;
        }
      }
      
      // Pause entre batches
      if (i + BATCH_SIZE < localLeads.length) {
        console.log(`⏸️ Pause batch... (${i + BATCH_SIZE}/${localLeads.length})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur migration leads:', error);
    stats.leads.errors = stats.leads.existing;
  }
}

async function migrateEstimations(localDb: postgres.Sql, stats: MigrationStats) {
  console.log('\n🔄 Migration table ESTIMATIONS...');
  
  try {
    const localEstimations = await localDb`SELECT * FROM estimations ORDER BY created_at DESC`;
    stats.estimations.existing = localEstimations.length;
    console.log(`📊 ${localEstimations.length} estimation(s) trouvée(s) en local`);
    
    if (localEstimations.length === 0) {
      console.log('ℹ️ Aucune estimation à migrer');
      return;
    }
    
    const { data: existingEstimations } = await supabaseAdmin
      .from('estimations')
      .select('id');
    
    const existingIds = new Set(existingEstimations?.map(e => e.id) || []);
    
    for (const estimation of localEstimations) {
      try {
        if (existingIds.has(estimation.id)) {
          console.log(`⚠️ Estimation "${estimation.id}" existe déjà - ignorée`);
          continue;
        }
        
        const estimationToMigrate = {
          id: estimation.id,
          lead_id: estimation.lead_id,
          property_type: estimation.property_type,
          address: estimation.address,
          city: estimation.city,
          surface: estimation.surface,
          rooms: estimation.rooms,
          estimated_value: estimation.estimated_value,
          price_per_m2: estimation.price_per_m2,
          confidence: estimation.confidence,
          methodology: estimation.methodology,
          comparable_properties: estimation.comparable_properties,
          created_at: estimation.created_at
        };
        
        const { error } = await supabaseAdmin
          .from('estimations')
          .insert(estimationToMigrate);
        
        if (error) {
          console.error(`❌ Erreur estimation "${estimation.id}":`, error);
          stats.estimations.errors++;
        } else {
          console.log(`✅ Estimation migré`);
          stats.estimations.migrated++;
        }
        
      } catch (error) {
        console.error(`💥 Erreur estimation:`, error);
        stats.estimations.errors++;
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur migration estimations:', error);
    stats.estimations.errors = stats.estimations.existing;
  }
}

async function migrateContacts(localDb: postgres.Sql, stats: MigrationStats) {
  console.log('\n🔄 Migration table CONTACTS...');
  
  try {
    const localContacts = await localDb`SELECT * FROM contacts ORDER BY created_at DESC`;
    stats.contacts.existing = localContacts.length;
    console.log(`📊 ${localContacts.length} contact(s) trouvé(s) en local`);
    
    if (localContacts.length === 0) {
      console.log('ℹ️ Aucun contact à migrer');
      return;
    }
    
    const { data: existingContacts } = await supabaseAdmin
      .from('contacts')
      .select('id');
    
    const existingIds = new Set(existingContacts?.map(c => c.id) || []);
    
    for (const contact of localContacts) {
      try {
        if (existingIds.has(contact.id)) {
          console.log(`⚠️ Contact "${contact.email}" existe déjà - ignoré`);
          continue;
        }
        
        const contactToMigrate = {
          id: contact.id,
          email: contact.email,
          phone: contact.phone,
          first_name: contact.first_name,
          last_name: contact.last_name,
          subject: contact.subject,
          message: contact.message,
          source: contact.source,
          status: contact.status || 'new',
          created_at: contact.created_at
        };
        
        const { error } = await supabaseAdmin
          .from('contacts')
          .insert(contactToMigrate);
        
        if (error) {
          console.error(`❌ Erreur contact "${contact.email}":`, error);
          stats.contacts.errors++;
        } else {
          console.log(`✅ Contact "${contact.email}" migré`);
          stats.contacts.migrated++;
        }
        
      } catch (error) {
        console.error(`💥 Erreur contact:`, error);
        stats.contacts.errors++;
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur migration contacts:', error);
    stats.contacts.errors = stats.contacts.existing;
  }
}

async function migrateEmailTemplates(localDb: postgres.Sql, stats: MigrationStats) {
  console.log('\n🔄 Migration table EMAIL_TEMPLATES...');
  
  try {
    const localTemplates = await localDb`SELECT * FROM email_templates ORDER BY created_at DESC`;
    stats.email_templates.existing = localTemplates.length;
    console.log(`📊 ${localTemplates.length} template(s) trouvé(s) en local`);
    
    if (localTemplates.length === 0) {
      console.log('ℹ️ Aucun template à migrer');
      return;
    }
    
    const { data: existingTemplates } = await supabaseAdmin
      .from('email_templates')
      .select('name');
    
    const existingNames = new Set(existingTemplates?.map(t => t.name) || []);
    
    for (const template of localTemplates) {
      try {
        if (existingNames.has(template.name)) {
          console.log(`⚠️ Template "${template.name}" existe déjà - ignoré`);
          continue;
        }
        
        const templateToMigrate = {
          id: template.id,
          name: template.name,
          subject: template.subject,
          html_content: template.html_content,
          text_content: template.text_content,
          category: template.category,
          is_active: template.is_active || true,
          variables: template.variables,
          created_at: template.created_at,
          updated_at: template.updated_at
        };
        
        const { error } = await supabaseAdmin
          .from('email_templates')
          .insert(templateToMigrate);
        
        if (error) {
          console.error(`❌ Erreur template "${template.name}":`, error);
          stats.email_templates.errors++;
        } else {
          console.log(`✅ Template "${template.name}" migré`);
          stats.email_templates.migrated++;
        }
        
      } catch (error) {
        console.error(`💥 Erreur template:`, error);
        stats.email_templates.errors++;
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur migration templates:', error);
    stats.email_templates.errors = stats.email_templates.existing;
  }
}

async function printMigrationSummary(stats: MigrationStats) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ MIGRATION DONNÉES CRITIQUES');
  console.log('='.repeat(60));
  
  let totalExisting = 0;
  let totalMigrated = 0;
  let totalErrors = 0;
  
  const tables = [
    { name: 'Users', stats: stats.users },
    { name: 'Leads', stats: stats.leads },
    { name: 'Estimations', stats: stats.estimations },
    { name: 'Contacts', stats: stats.contacts },
    { name: 'Email Templates', stats: stats.email_templates }
  ];
  
  console.log('\nDétail par table :');
  tables.forEach(({ name, stats: tableStats }) => {
    const status = tableStats.errors > 0 ? '⚠️' : '✅';
    console.log(`${status} ${name}: ${tableStats.migrated}/${tableStats.existing} migrés (${tableStats.errors} erreurs)`);
    
    totalExisting += tableStats.existing;
    totalMigrated += tableStats.migrated;
    totalErrors += tableStats.errors;
  });
  
  console.log('\n' + '-'.repeat(40));
  console.log(`📊 TOTAL: ${totalMigrated}/${totalExisting} enregistrements migrés`);
  console.log(`❌ Erreurs: ${totalErrors}`);
  console.log(`✅ Succès: ${totalMigrated > 0 ? 'DONNÉES SAUVEGARDÉES' : 'AUCUNE DONNÉE TROUVÉE'}`);
  
  if (totalMigrated > 0) {
    console.log('\n🎉 Migration réussie ! Vos données sont maintenant dans Supabase.');
    console.log('⚠️ Vous pouvez maintenant supprimer la base Neon en toute sécurité.');
  } else {
    console.log('\n⚠️ Aucune donnée migrée. Vérifiez la connexion à la base locale.');
  }
}

// Fonction principale
async function migrateAllDataToSupabase() {
  console.log('🚀 MIGRATION CRITIQUE: PostgreSQL → Supabase');
  console.log('🎯 Sauvegarde données avant suppression Neon');
  
  const stats: MigrationStats = {
    users: { existing: 0, migrated: 0, errors: 0 },
    leads: { existing: 0, migrated: 0, errors: 0 },
    estimations: { existing: 0, migrated: 0, errors: 0 },
    contacts: { existing: 0, migrated: 0, errors: 0 },
    email_templates: { existing: 0, migrated: 0, errors: 0 }
  };
  
  let localDb: postgres.Sql | null = null;
  
  try {
    // Connexion base locale
    localDb = await connectToLocalDB();
    
    // Migration des tables par ordre d'importance
    await migrateUsers(localDb, stats);
    await migrateLeads(localDb, stats);
    await migrateEstimations(localDb, stats);
    await migrateContacts(localDb, stats);
    await migrateEmailTemplates(localDb, stats);
    
    // Résumé final
    await printMigrationSummary(stats);
    
  } catch (error) {
    console.error('💥 Erreur fatale migration:', error);
    process.exit(1);
  } finally {
    // Fermer connexion
    if (localDb) {
      await localDb.end();
      console.log('🔐 Connexion base locale fermée');
    }
  }
}

// Exécution automatique
migrateAllDataToSupabase()
  .then(() => {
    console.log('\n🏁 Script migration terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { migrateAllDataToSupabase };