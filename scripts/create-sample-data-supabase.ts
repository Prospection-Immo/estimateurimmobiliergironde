import { supabaseAdmin } from '../server/lib/supabaseAdmin';
import bcrypt from 'bcrypt';

// Création de données d'exemple pour système fonctionnel sur VPS

async function createSampleUsers() {
  console.log('\n👥 Création utilisateurs admin...');
  
  try {
    // Vérifier users existants
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('username');
    
    const existingUsernames = new Set(existingUsers?.map(u => u.username) || []);
    
    // Admin par défaut
    const defaultAdmin = {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10), // Hash sécurisé
      role: 'admin'
    };
    
    if (!existingUsernames.has('admin')) {
      const { error } = await supabaseAdmin
        .from('users')
        .insert(defaultAdmin);
      
      if (error) {
        console.error('❌ Erreur création admin:', error);
      } else {
        console.log('✅ Admin créé (username: admin, password: admin123)');
      }
    } else {
      console.log('⚠️ Admin existe déjà');
    }
    
  } catch (error) {
    console.error('💥 Erreur création users:', error);
  }
}

async function createSampleLeads() {
  console.log('\n📋 Création leads d\'exemple...');
  
  try {
    // Vérifier leads existants
    const { data: existingLeads } = await supabaseAdmin
      .from('leads')
      .select('email');
    
    const existingEmails = new Set(existingLeads?.map(l => l.email) || []);
    
    const sampleLeads = [
      {
        email: 'marie.dupont@gmail.com',
        phone: '05 56 34 12 87',
        first_name: 'Marie',
        last_name: 'Dupont',
        property_type: 'house',
        address: '45 Avenue de la République',
        city: 'Mérignac',
        postal_code: '33700',
        surface: 120,
        rooms: 5,
        bedrooms: 3,
        bathrooms: 2,
        has_garden: true,
        has_parking: true,
        construction_year: 1995,
        sale_timeline: '6m',
        wants_expert_contact: true,
        estimated_value: '485000.00',
        project_type: 'vente_immediate',
        timeline: '3_6_mois',
        ownership_status: 'proprietaire_unique',
        source: 'estimation-immobilier-gironde.fr',
        lead_type: 'estimation_detailed',
        status: 'new'
      },
      {
        email: 'pierre.martin@outlook.fr',
        phone: '05 56 78 23 45',
        first_name: 'Pierre',
        last_name: 'Martin',
        property_type: 'apartment',
        address: '12 Rue Sainte-Catherine',
        city: 'Bordeaux',
        postal_code: '33000',
        surface: 75,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
        has_balcony: true,
        construction_year: 2010,
        sale_timeline: 'immediate',
        wants_expert_contact: true,
        estimated_value: '325000.00',
        project_type: 'curiosite',
        timeline: '1_3_mois',
        ownership_status: 'coproprietaire',
        source: 'estimation-immobilier-gironde.fr',
        lead_type: 'estimation_quick',
        status: 'contacted'
      },
      {
        email: 'sophie.bernard@yahoo.fr',
        phone: '05 56 45 67 89',
        first_name: 'Sophie',
        last_name: 'Bernard',
        property_type: 'house',
        address: '28 Boulevard des Océans',
        city: 'Arcachon',
        postal_code: '33120',
        surface: 180,
        rooms: 7,
        bedrooms: 4,
        bathrooms: 3,
        has_garden: true,
        has_parking: true,
        construction_year: 1988,
        sale_timeline: '6m',
        wants_expert_contact: false,
        estimated_value: '890000.00',
        project_type: 'succession',
        timeline: '6_12_mois',
        ownership_status: 'proprietaire_unique',
        source: 'estimation-immobilier-gironde.fr',
        lead_type: 'guide_download',
        guide_slug: 'guide-succession-vendre-bien-herite',
        status: 'converted'
      },
      {
        email: 'julien.rousseau@gmail.com',
        first_name: 'Julien',
        last_name: 'Rousseau',
        financing_project_type: 'Achat résidence principale',
        project_amount: '350 000 €',
        source: 'estimation-immobilier-gironde.fr',
        lead_type: 'financing',
        status: 'new'
      }
    ];
    
    let createdCount = 0;
    
    for (const lead of sampleLeads) {
      if (!existingEmails.has(lead.email)) {
        const { error } = await supabaseAdmin
          .from('leads')
          .insert(lead);
        
        if (error) {
          console.error(`❌ Erreur lead "${lead.email}":`, error);
        } else {
          console.log(`✅ Lead "${lead.email}" créé`);
          createdCount++;
        }
      } else {
        console.log(`⚠️ Lead "${lead.email}" existe déjà`);
      }
    }
    
    console.log(`📊 ${createdCount} lead(s) créé(s)`);
    
  } catch (error) {
    console.error('💥 Erreur création leads:', error);
  }
}

async function createSampleEstimations() {
  console.log('\n🏠 Création estimations d\'exemple...');
  
  try {
    // Récupérer les leads créés pour lier les estimations
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('id, first_name, last_name')
      .limit(3);
    
    if (!leads || leads.length === 0) {
      console.log('⚠️ Aucun lead trouvé pour créer des estimations');
      return;
    }
    
    const sampleEstimations = [
      {
        lead_id: leads[0]?.id,
        property_type: 'house',
        address: '45 Avenue de la République',
        city: 'Mérignac',
        surface: 120,
        rooms: 5,
        estimated_value: '485000.00',
        price_per_m2: '4041.67',
        confidence: 85,
        methodology: 'Analyse comparative de marché + ajustements spécifiques',
        comparable_properties: JSON.stringify([
          { address: '52 Ave République', price: 475000, surface: 115 },
          { address: '38 Ave Libération', price: 495000, surface: 125 },
          { address: '61 Rue des Écoles', price: 470000, surface: 118 }
        ])
      },
      {
        lead_id: leads[1]?.id,
        property_type: 'apartment',
        address: '12 Rue Sainte-Catherine',
        city: 'Bordeaux',
        surface: 75,
        rooms: 3,
        estimated_value: '325000.00',
        price_per_m2: '4333.33',
        confidence: 92,
        methodology: 'Données DVF + analyse micro-localisation Bordeaux centre',
        comparable_properties: JSON.stringify([
          { address: '15 Rue Ste-Catherine', price: 315000, surface: 72 },
          { address: '8 Rue des Remparts', price: 335000, surface: 78 },
          { address: '24 Cours de l\'Intendance', price: 340000, surface: 76 }
        ])
      },
      {
        lead_id: leads[2]?.id,
        property_type: 'house',
        address: '28 Boulevard des Océans',
        city: 'Arcachon',
        surface: 180,
        rooms: 7,
        estimated_value: '890000.00',
        price_per_m2: '4944.44',
        confidence: 78,
        methodology: 'Valorisation spécifique Bassin d\'Arcachon + proximité plages',
        comparable_properties: JSON.stringify([
          { address: '15 Bd des Plages', price: 850000, surface: 175 },
          { address: '42 Ave des Dunes', price: 920000, surface: 185 },
          { address: '33 Allée des Pins', price: 875000, surface: 178 }
        ])
      }
    ];
    
    let createdCount = 0;
    
    for (const estimation of sampleEstimations) {
      if (estimation.lead_id) {
        const { error } = await supabaseAdmin
          .from('estimations')
          .insert(estimation);
        
        if (error) {
          console.error(`❌ Erreur estimation ${estimation.city}:`, error);
        } else {
          console.log(`✅ Estimation ${estimation.city} créée`);
          createdCount++;
        }
      }
    }
    
    console.log(`📊 ${createdCount} estimation(s) créée(s)`);
    
  } catch (error) {
    console.error('💥 Erreur création estimations:', error);
  }
}

async function createSampleContacts() {
  console.log('\n📞 Création contacts d\'exemple...');
  
  try {
    const sampleContacts = [
      {
        email: 'info@exemple-client.fr',
        phone: '05 56 12 34 56',
        first_name: 'Laurent',
        last_name: 'Durand',
        subject: 'Question sur estimation gratuite',
        message: 'Bonjour, je souhaiterais avoir des informations sur vos services d\'estimation gratuite pour une maison à Pessac.',
        source: 'estimation-immobilier-gironde.fr',
        status: 'new'
      },
      {
        email: 'contact@societe-exemple.com',
        first_name: 'Isabelle',
        last_name: 'Moreau',
        subject: 'Demande de partenariat',
        message: 'Nous sommes une agence immobilière en Gironde et aimerions discuter d\'un éventuel partenariat.',
        source: 'estimation-immobilier-gironde.fr',
        status: 'contacted'
      }
    ];
    
    let createdCount = 0;
    
    for (const contact of sampleContacts) {
      const { error } = await supabaseAdmin
        .from('contacts')
        .insert(contact);
      
      if (error) {
        console.error(`❌ Erreur contact "${contact.email}":`, error);
      } else {
        console.log(`✅ Contact "${contact.email}" créé`);
        createdCount++;
      }
    }
    
    console.log(`📊 ${createdCount} contact(s) créé(s)`);
    
  } catch (error) {
    console.error('💥 Erreur création contacts:', error);
  }
}

async function createSampleEmailTemplates() {
  console.log('\n📧 Création templates email...');
  
  try {
    const sampleTemplates = [
      {
        name: 'Confirmation estimation',
        subject: 'Votre estimation immobilière gratuite en Gironde',
        html_content: `
          <h2>Merci pour votre demande d'estimation !</h2>
          <p>Bonjour {{firstName}},</p>
          <p>Nous avons bien reçu votre demande d'estimation pour votre bien situé à {{city}}.</p>
          <p>Notre équipe d'experts va analyser votre dossier et vous transmettre une estimation précise dans les plus brefs délais.</p>
          <p>Cordialement,<br>L'équipe Estimation Immobilier Gironde</p>
        `,
        text_content: `
          Merci pour votre demande d'estimation !
          
          Bonjour {{firstName}},
          
          Nous avons bien reçu votre demande d'estimation pour votre bien situé à {{city}}.
          Notre équipe d'experts va analyser votre dossier et vous transmettre une estimation précise dans les plus brefs délais.
          
          Cordialement,
          L'équipe Estimation Immobilier Gironde
        `,
        category: 'estimation_confirmation',
        is_active: true,
        variables: JSON.stringify(['firstName', 'city', 'propertyType'])
      },
      {
        name: 'Guide téléchargé',
        subject: 'Votre guide immobilier gratuit est prêt !',
        html_content: `
          <h2>Votre guide immobilier gratuit</h2>
          <p>Bonjour {{firstName}},</p>
          <p>Vous avez téléchargé le guide "{{guideTitle}}".</p>
          <p>Vous le trouverez en pièce jointe de cet email.</p>
          <p>Si vous avez des questions, notre équipe reste à votre disposition.</p>
          <p>Cordialement,<br>L'équipe Estimation Immobilier Gironde</p>
        `,
        text_content: `
          Votre guide immobilier gratuit
          
          Bonjour {{firstName}},
          
          Vous avez téléchargé le guide "{{guideTitle}}".
          Vous le trouverez en pièce jointe de cet email.
          
          Si vous avez des questions, notre équipe reste à votre disposition.
          
          Cordialement,
          L'équipe Estimation Immobilier Gironde
        `,
        category: 'guide_download',
        is_active: true,
        variables: JSON.stringify(['firstName', 'guideTitle'])
      },
      {
        name: 'Contact reçu',
        subject: 'Nous avons bien reçu votre message',
        html_content: `
          <h2>Message bien reçu</h2>
          <p>Bonjour {{firstName}},</p>
          <p>Nous avons bien reçu votre message concernant "{{subject}}".</p>
          <p>Notre équipe va traiter votre demande et vous répondre dans les meilleurs délais.</p>
          <p>Cordialement,<br>L'équipe Estimation Immobilier Gironde</p>
        `,
        text_content: `
          Message bien reçu
          
          Bonjour {{firstName}},
          
          Nous avons bien reçu votre message concernant "{{subject}}".
          Notre équipe va traiter votre demande et vous répondre dans les meilleurs délais.
          
          Cordialement,
          L'équipe Estimation Immobilier Gironde
        `,
        category: 'contact_confirmation',
        is_active: true,
        variables: JSON.stringify(['firstName', 'subject'])
      }
    ];
    
    let createdCount = 0;
    
    for (const template of sampleTemplates) {
      const { error } = await supabaseAdmin
        .from('email_templates')
        .insert(template);
      
      if (error) {
        console.error(`❌ Erreur template "${template.name}":`, error);
      } else {
        console.log(`✅ Template "${template.name}" créé`);
        createdCount++;
      }
    }
    
    console.log(`📊 ${createdCount} template(s) créé(s)`);
    
  } catch (error) {
    console.error('💥 Erreur création templates:', error);
  }
}

async function main() {
  console.log('🚀 CRÉATION DONNÉES D\'EXEMPLE POUR VPS');
  console.log('🎯 Système complet fonctionnel\n');
  
  try {
    await createSampleUsers();
    await createSampleLeads();
    await createSampleEstimations();
    await createSampleContacts();
    await createSampleEmailTemplates();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ SYSTÈME PRÊT POUR LE VPS !');
    console.log('='.repeat(50));
    console.log('🔐 Admin: username = admin, password = admin123');
    console.log('📊 Données d\'exemple créées dans Supabase');
    console.log('🚀 Application prête pour déploiement');
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécution automatique
main()
  .then(() => {
    console.log('\n🏁 Création données d\'exemple terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { main };