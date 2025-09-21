import { supabaseAdmin } from '../server/lib/supabaseAdmin';

// Prompts OpenAI configurables par défaut pour chaque fonctionnalité
const defaultPrompts = [
  {
    functionality: 'article_generation',
    name: 'Génération d\'articles immobiliers',
    description: 'Génère des articles SEO-optimisés sur l\'immobilier en Gironde',
    role: 'Expert en rédaction immobilière française spécialisé en Gironde',
    competences: [
      'Expertise marché immobilier français',
      'Rédaction SEO optimisée',
      'Connaissance réglementaire immobilier',
      'Conseils pratiques propriétaires/investisseurs',
      'Structuration HTML professionnelle'
    ],
    tache: 'Créer un article complet, informatif et optimisé SEO sur un sujet immobilier spécifique',
    caracteristiques: [
      'Contenu 600-800 mots',
      'Structure H1/H2/H3 claire',
      'Conseils pratiques avec exemples concrets',
      'Données chiffrées réalistes Gironde',
      'Ton professionnel mais accessible',
      'Call-to-action approprié'
    ],
    processus: `1. Analyser le sujet et mots-clés fournis
2. Structurer l'article avec introduction accrocheuse
3. Développer 3-4 sections principales avec sous-titres
4. Intégrer conseils pratiques et bullet points
5. Conclure avec call-to-action
6. Optimiser SEO (meta description, slug, mots-clés)`,
    prompt_template: `Tu es un {{role}}. 

Génère un article complet sur le sujet suivant :
- Titre principal : {{title}}
- Sujet : {{topic}}
- Mots-clés à intégrer : {{keywords}}
- Longueur : {{length}}
- Ton : {{tone}}
- Région cible : {{targetRegion}}

L'article doit respecter ces critères :
1. Être informatif et utile pour les propriétaires et investisseurs
2. Inclure des conseils pratiques et des exemples concrets
3. Mentionner des références crédibles (notaires, agents immobiliers, lois françaises)
4. Être optimisé SEO avec une structure claire (H1, H2, H3)
5. Inclure des données chiffrées réalistes pour {{targetRegion}}
6. Avoir un ton professionnel mais accessible

⚠️ OBLIGATION: Toujours inclure TOUS les champs: title, slug, metaDescription, content, summary, keywords, seoElements.

Structure demandée :
- Introduction accrocheuse
- 3-4 sections principales avec sous-titres
- Conseils pratiques avec bullet points
- Conclusion avec call-to-action
- Pas d'images (texte uniquement)

Réponds en JSON avec cette structure exacte :
{
  "title": "titre optimisé SEO",
  "slug": "url-friendly-slug", 
  "metaDescription": "description de 150-160 caractères",
  "content": "contenu HTML complet avec balises h2, h3, p, ul, li",
  "summary": "résumé de 2-3 phrases",
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"],
  "seoElements": {
    "title": "titre SEO",
    "description": "meta description",
    "slug": "slug-url"
  }
}`,
    model: 'gpt-4o',
    temperature: '0.7',
    max_tokens: 4000,
    response_format: 'json_object',
    variables: ['role', 'title', 'topic', 'keywords', 'length', 'tone', 'targetRegion'],
    is_active: true
  },
  {
    functionality: 'market_insights',
    name: 'Analyse insights marché immobilier',
    description: 'Génère des analyses de marché immobilier par type de bien et région',
    role: 'Expert analyste du marché immobilier français',
    competences: [
      'Analyse données marché immobilier',
      'Connaissance tendances sectorielles',
      'Évaluation prix région Gironde', 
      'Conseils stratégiques achat/vente',
      'Synthèse insights actionnable'
    ],
    tache: 'Produire une analyse de marché précise avec tendances et recommandations stratégiques',
    caracteristiques: [
      'Analyse factuelle 2-3 paragraphes',
      '3-4 tendances principales identifiées',
      '3 recommandations concrètes',
      'Données réalistes et crédibles',
      'Insights actionnables'
    ],
    processus: `1. Analyser l'état actuel du marché pour le type de bien
2. Identifier 3-4 tendances principales du secteur
3. Évaluer les opportunités et risques
4. Formuler 3 recommandations stratégiques
5. Synthétiser dans une analyse cohérente`,
    prompt_template: `En tant qu'{{role}}, génère une analyse de marché pour :
- Type de bien : {{propertyType}}
- Région : {{region}}

Fournis une analyse courte mais précise incluant :
1. État actuel du marché
2. Tendances principales (3-4 points)
3. Recommandations pour acheteurs/vendeurs (3 points)

Utilise des données réalistes et crédibles. Réponds en JSON :
{
  "insights": "analyse générale en 2-3 paragraphes",
  "trends": ["tendance 1", "tendance 2", "tendance 3"],
  "recommendations": ["conseil 1", "conseil 2", "conseil 3"]
}`,
    model: 'gpt-4o',
    temperature: '0.8', 
    max_tokens: 2000,
    response_format: 'json_object',
    variables: ['role', 'propertyType', 'region'],
    is_active: true
  },
  {
    functionality: 'guide_creation',
    name: 'Création guides vendeurs personnalisés',
    description: 'Génère des guides détaillés adaptés à chaque persona de vendeur',
    role: 'Expert conseil en vente immobilière et marketing persona',
    competences: [
      'Psychologie personas vendeurs',
      'Stratégies vente adaptées',
      'Conseils pratiques immobilier',
      'Storytelling engageant',
      'Structure pédagogique progressive'
    ],
    tache: 'Créer un guide complet adapté à un persona vendeur spécifique avec conseils pratiques',
    caracteristiques: [
      'Contenu adapté au persona cible',
      'Structure pédagogique progressive',
      'Conseils pratiques actionnables',
      'Exemples concrets et études de cas',
      'Checklist et outils pratiques',
      'Ton adapté à la psychologie du persona'
    ],
    processus: `1. Analyser les caractéristiques du persona cible
2. Identifier ses motivations et freins spécifiques
3. Structurer le contenu selon ses besoins prioritaires
4. Développer conseils pratiques adaptés
5. Intégrer exemples et études de cas pertinents
6. Créer checklist et outils pratiques`,
    prompt_template: `Tu es un {{role}} spécialisé pour le persona "{{persona}}".

Caractéristiques du persona :
- Profil : {{personaProfile}}
- Motivations : {{motivations}}
- Freins : {{painPoints}}
- Style communication : {{communicationStyle}}

Crée un guide complet sur le sujet : {{subject}}

Le guide doit :
1. S'adapter parfaitement au profil psychologique du persona
2. Répondre à ses préoccupations spécifiques
3. Utiliser un ton et vocabulaire appropriés
4. Proposer des solutions pratiques et actionnables
5. Inclure des exemples concrets de la région {{region}}

Structure attendue :
- Introduction adaptée au persona
- 4-5 sections principales avec conseils pratiques
- Checklist actionnable
- Conclusion avec prochaines étapes

Réponds en JSON :
{
  "title": "titre adapté au persona",
  "slug": "slug-url-friendly",
  "content": "contenu HTML structuré",
  "summary": "résumé personnalisé",
  "shortBenefit": "bénéfice en 1 phrase",
  "readingTime": temps_lecture_minutes,
  "pdfContent": "contenu enrichi pour PDF avec bonus"
}`,
    model: 'gpt-4o',
    temperature: '0.8',
    max_tokens: 5000,
    response_format: 'json_object',
    variables: ['role', 'persona', 'personaProfile', 'motivations', 'painPoints', 'communicationStyle', 'subject', 'region'],
    is_active: true
  },
  {
    functionality: 'email_personalization',
    name: 'Personnalisation emails marketing',
    description: 'Adapte les emails marketing selon le persona et le contexte du lead',
    role: 'Expert email marketing immobilier et psychologie client',
    competences: [
      'Email marketing personnalisé',
      'Psychologie persuasion',
      'Segmentation personas',
      'Copywriting conversion',
      'Automatisation relationnelle'
    ],
    tache: 'Personnaliser le contenu email selon le persona du lead et son étape dans le funnel',
    caracteristiques: [
      'Message adapté au persona',
      'Ligne d\'objet percutante',
      'Contenu personnalisé contextuel',
      'Call-to-action adapté',
      'Ton relationnel approprié'
    ],
    processus: `1. Analyser le persona et étape du funnel
2. Adapter le ton et le style de communication  
3. Personnaliser l'accroche et le contenu
4. Optimiser le call-to-action selon l'objectif
5. Ajuster la fréquence et timing`,
    prompt_template: `Tu es un {{role}}.

Personnalise cet email pour :
- Persona : {{persona}}
- Étape funnel : {{funnelStage}}
- Contexte : {{context}}
- Objectif : {{objective}}

Informations du lead :
- Nom : {{firstName}}
- Projet : {{projectType}}
- Ville : {{city}}
- Timeline : {{timeline}}

Template de base : {{emailTemplate}}

Adapte le contenu en gardant la structure mais en personnalisant :
1. Ligne d'objet selon le persona
2. Accroche personnalisée
3. Contenu adapté aux motivations du persona
4. Call-to-action optimisé pour l'étape du funnel

Réponds en JSON :
{
  "subject": "ligne d'objet personnalisée",
  "htmlContent": "contenu HTML personnalisé",
  "textContent": "version texte personnalisée",
  "personalizations": ["élément1", "élément2", "élément3"]
}`,
    model: 'gpt-4o',
    temperature: '0.6',
    max_tokens: 3000,
    response_format: 'json_object',
    variables: ['role', 'persona', 'funnelStage', 'context', 'objective', 'firstName', 'projectType', 'city', 'timeline', 'emailTemplate'],
    is_active: true
  }
];

async function createOpenaiPromptsInSupabase() {
  console.log('🚀 Création des prompts OpenAI configurables...');
  
  try {
    // Vérifier les prompts existants
    const { data: existingPrompts } = await supabaseAdmin
      .from('openai_prompts')
      .select('functionality');
    
    const existingFunctionalities = new Set(existingPrompts?.map(p => p.functionality) || []);
    console.log(`📊 ${existingPrompts?.length || 0} prompt(s) existant(s)`);
    
    let createdCount = 0;
    
    for (const prompt of defaultPrompts) {
      try {
        if (existingFunctionalities.has(prompt.functionality)) {
          console.log(`⚠️ Prompt "${prompt.functionality}" existe déjà`);
          continue;
        }
        
        const { error } = await supabaseAdmin
          .from('openai_prompts')
          .insert(prompt);
        
        if (error) {
          console.error(`❌ Erreur prompt "${prompt.functionality}":`, error);
        } else {
          console.log(`✅ Prompt "${prompt.name}" créé`);
          createdCount++;
        }
        
      } catch (error) {
        console.error(`💥 Erreur "${prompt.functionality}":`, error);
      }
    }
    
    console.log(`\n🎉 ${createdCount} prompt(s) créé(s) !`);
    
    // Afficher le résumé des prompts configurables
    const { data: allPrompts } = await supabaseAdmin
      .from('openai_prompts')
      .select('functionality, name, is_active')
      .order('functionality');
    
    if (allPrompts && allPrompts.length > 0) {
      console.log('\n📋 PROMPTS OPENAI CONFIGURABLES :');
      console.log('=' .repeat(50));
      allPrompts.forEach(prompt => {
        const status = prompt.is_active ? '✅' : '❌';
        console.log(`${status} ${prompt.functionality}: ${prompt.name}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

// Exécution automatique
createOpenaiPromptsInSupabase()
  .then(() => {
    console.log('\n🏁 Création prompts OpenAI terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { createOpenaiPromptsInSupabase };