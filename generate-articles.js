// Using native fetch in Node.js 18+

const API_BASE_URL = 'http://localhost:5000';

// Configuration des articles à générer
const articles = [
  {
    keyword: "estimation maison Gironde",
    title: "Estimation Maison Gironde : Guide Complet 2025 pour Évaluer Votre Bien",
    slug: "estimation-maison-gironde-guide-complet-2025",
    category: "estimation",
    prompt: `Tu es une IA experte en rédaction d'articles de blog optimisés SEO selon les critères E-E-A-T de Google. Rédige un article de 1500 mots sur le mot-clé "estimation maison Gironde".

Structure à respecter :
1. Introduction locale (maison en Gironde)
2. Étude de cas réelle ou fictive dans une ville girondine
3. Critères d'estimation spécifiques aux maisons (surface, terrain, PLU, etc.)
4. Données officielles, citations d'experts
5. Mentions légales (succession, divorce, etc.)
6. Conclusion + appel à l'action

Utilise un ton professionnel, intègre le mot-clé naturellement, respecte exactement 1500 mots. Format de sortie : HTML seulement, sans balises <html> ou <body>, commence directement par le contenu.`
  },
  {
    keyword: "estimation appartement Gironde",
    title: "Estimation Appartement Gironde : Comment Évaluer Votre Bien en 2025",
    slug: "estimation-appartement-gironde-evaluer-bien-2025",
    category: "estimation",
    prompt: `Rédige un article de 1500 mots sur le mot-clé "estimation appartement Gironde", structuré pour le SEO et basé sur les critères E-E-A-T. Le contenu doit expliquer comment estimer un appartement en Gironde (Bordeaux, Mérignac, etc.), avec étude de cas, critères spécifiques (étage, charges, ascenseur…), sources fiables, expertises, et appel à l'action localisé.

Structure E-E-A-T complète avec introduction, cas concret, définition + facteurs influents, sources officielles, législation et conclusion. Format HTML uniquement.`
  },
  {
    keyword: "valeur immobilière Gironde",
    title: "Valeur Immobilière Gironde : Comprendre le Marché 2025",
    slug: "valeur-immobiliere-gironde-marche-2025",
    category: "estimation",
    prompt: `Écris un article SEO de 1500 mots sur le thème "valeur immobilière Gironde". L'article doit expliquer comment se calcule la valeur immobilière dans le département (ville vs campagne, effet littoral, proximité Bordeaux), avec données 2025, outils, points de vigilance et conseils d'experts.

Structure E-E-A-T complète avec introduction, cas concret (ex : maison à Libourne ou Arcachon), définition + facteurs influents, sources officielles (DVF, Notaires), législation et cas particuliers, conclusion et appel à estimer un bien en Gironde. Format HTML uniquement.`
  },
  {
    keyword: "estimation bien immobilier Gironde",
    title: "Estimation Bien Immobilier Gironde : Méthodes et Outils 2025",
    slug: "estimation-bien-immobilier-gironde-methodes-outils-2025",
    category: "estimation",
    prompt: `Rédige un article complet de 1500 mots optimisé SEO sur le mot-clé "estimation bien immobilier Gironde". Expliquer comment estimer tout type de bien (maison, appart, local, terrain), avec particularités locales, outils à jour, exemples précis, et recours à des experts girondins.

Respecte la structure E-E-A-T avec introduction, étude de cas, critères d'estimation, données officielles, mentions légales et conclusion. Format HTML uniquement.`
  },
  {
    keyword: "estimation bien Gironde",
    title: "Estimation Bien Gironde : Solutions Complètes pour Tous les Biens",
    slug: "estimation-bien-gironde-solutions-completes-2025",
    category: "estimation",
    prompt: `Rédige un article de 1500 mots sur "estimation bien Gironde", en gardant un ton pro et accessible. Le mot-clé cible un public large : particulier, investisseur, héritier, etc. Intègre les spécificités girondines, les outils en ligne locaux, et les conseils pour obtenir une estimation fiable en 2025.

Inclure étude de cas + données actualisées. Structure E-E-A-T complète. Format HTML uniquement.`
  },
  {
    keyword: "valeur maison Gironde",
    title: "Valeur Maison Gironde : Facteurs et Calculs en 2025",
    slug: "valeur-maison-gironde-facteurs-calculs-2025",
    category: "estimation",
    prompt: `Rédige un article SEO de 1500 mots sur "valeur maison Gironde". Objectif : expliquer comment connaître la vraie valeur d'une maison en Gironde, quels facteurs influencent le prix (lieu, type, travaux, diagnostics), avec focus sur marché 2025.

Inclure exemples concrets, données du marché, et avis d'expert local. Structure E-E-A-T complète. Format HTML uniquement.`
  },
  {
    keyword: "estimation terrain Gironde",
    title: "Estimation Terrain Gironde : Guide pour Terrains Constructibles 2025",
    slug: "estimation-terrain-gironde-constructibles-2025",
    category: "estimation",
    prompt: `Rédige un article de blog de 1500 mots optimisé pour le mot-clé "estimation terrain Gironde". Le contenu doit expliquer comment estimer un terrain en Gironde (constructible ou non), critères essentiels (PLU, viabilisation, COS), cas concrets en zone rurale ou littorale, erreurs fréquentes.

Inclure sources légales et organismes compétents. Structure E-E-A-T complète. Format HTML uniquement.`
  },
  {
    keyword: "valeur appartement Gironde",
    title: "Valeur Appartement Gironde : Estimation par Quartiers 2025",
    slug: "valeur-appartement-gironde-quartiers-2025",
    category: "estimation",
    prompt: `Rédige un article SEO de 1500 mots avec le mot-clé "valeur appartement Gironde". Expliquer comment se détermine la valeur d'un appartement (selon le quartier, l'année, les charges, les prestations), avec zoom sur Bordeaux, Talence, Arcachon.

Intégrer données officielles, estimation comparative, outils à jour. Structure E-E-A-T complète. Format HTML uniquement.`
  },
  {
    keyword: "estimation achat Gironde",
    title: "Estimation Achat Gironde : Guide Acheteur 2025",
    slug: "estimation-achat-gironde-guide-acheteur-2025",
    category: "estimation",
    prompt: `Rédige un article de 1500 mots optimisé SEO sur "estimation achat Gironde". Le contenu doit aider les acheteurs à évaluer la valeur réelle d'un bien avant d'acheter, éviter les pièges, utiliser des outils fiables, et faire appel à un expert local si nécessaire.

Inclure étude de cas en Gironde, comparateurs, simulateurs, recommandations juridiques. Structure E-E-A-T complète. Format HTML uniquement.`
  }
];

async function generateAndCreateArticle(articleConfig, index) {
  console.log(`\n🚀 Génération de l'article ${index + 1}/9: "${articleConfig.keyword}"`);
  
  try {
    // Étape 1: Générer le contenu avec OpenAI
    console.log('📝 Génération du contenu avec OpenAI...');
    const generateResponse = await fetch(`${API_BASE_URL}/api/articles/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: articleConfig.title,
        topic: articleConfig.keyword,
        keywords: [articleConfig.keyword, "Gironde", "immobilier", "estimation", "2025"]
      }),
    });

    if (!generateResponse.ok) {
      throw new Error(`Erreur génération: ${generateResponse.status}`);
    }

    const generatedData = await generateResponse.json();
    
    // Étape 2: Créer l'article dans la base de données
    console.log('💾 Création de l\'article dans la base de données...');
    const articleData = {
      title: articleConfig.title,
      slug: articleConfig.slug,
      content: generatedData.content,
      metaDescription: generatedData.metaDescription || `Guide complet sur ${articleConfig.keyword}. Conseils d'experts, méthodes et outils pour une estimation fiable en Gironde 2025.`,
      seoTitle: generatedData.seoTitle || articleConfig.title,
      summary: generatedData.summary || `Découvrez comment réaliser une estimation précise pour ${articleConfig.keyword} avec notre guide expert.`,
      keywords: [articleConfig.keyword, "Gironde", "immobilier", "estimation", "2025"],
      category: articleConfig.category,
      status: "published",
      authorName: "Expert Immobilier Gironde"
    };

    const createResponse = await fetch(`${API_BASE_URL}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=admin-session' // Session d'admin simulée
      },
      body: JSON.stringify(articleData),
    });

    if (!createResponse.ok) {
      throw new Error(`Erreur création: ${createResponse.status}`);
    }

    const createdArticle = await createResponse.json();
    
    console.log(`✅ Article créé avec succès !`);
    console.log(`📄 Titre: ${createdArticle.title}`);
    console.log(`🔗 Slug: ${createdArticle.slug}`);
    console.log(`🆔 ID: ${createdArticle.id}`);
    console.log(`🌐 URL: http://localhost:5000/actualites/${createdArticle.slug}`);
    
    return createdArticle;
    
  } catch (error) {
    console.error(`❌ Erreur lors de la génération de l'article "${articleConfig.keyword}":`, error.message);
    throw error;
  }
}

async function generateAllArticles() {
  console.log('🎯 Début de la génération des 9 articles SEO sur l\'estimation immobilière en Gironde\n');
  
  const results = [];
  
  for (let i = 0; i < articles.length; i++) {
    try {
      const result = await generateAndCreateArticle(articles[i], i);
      results.push(result);
      
      // Pause entre les générations pour éviter les limites de taux
      if (i < articles.length - 1) {
        console.log('⏳ Pause de 2 secondes avant le prochain article...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Échec pour l'article ${i + 1}: ${error.message}`);
      results.push({ error: error.message, config: articles[i] });
    }
  }
  
  console.log('\n🎉 Génération terminée !');
  console.log(`✅ Articles créés avec succès: ${results.filter(r => !r.error).length}/9`);
  console.log(`❌ Articles en échec: ${results.filter(r => r.error).length}/9`);
  
  if (results.filter(r => !r.error).length > 0) {
    console.log('\n🌐 Accéder aux articles:');
    results.filter(r => !r.error).forEach(article => {
      console.log(`• ${article.title}: http://localhost:5000/actualites/${article.slug}`);
    });
  }
  
  return results;
}

// Exécuter la génération
generateAllArticles()
  .then(() => {
    console.log('\n🎯 Tous les articles ont été traités !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });