import fs from 'fs';

// Article data extracted from persona files
const articleData = {
  "vendeur-presse": {
    category: "conseils",
    articles: [
      "Pourquoi vendre vite peut vous coûter cher",
      "Les erreurs classiques quand on accepte la première offre",
      "Comment sécuriser une vente rapide sans brader",
      "3 stratégies de mise en avant pour vendre vite et bien",
      "Témoignage : comment j'ai vendu en 30 jours sans perdre 20 000 €"
    ]
  },
  "vendeur-prudent": {
    category: "estimation",
    articles: [
      "Le danger invisible des estimations gratuites trop flatteuses",
      "Comment savoir si votre agent vous dit la vérité sur le prix",
      "Les 7 garanties indispensables avant de signer un mandat",
      "Estimation, préparation, visibilité : le trio gagnant d'une vente sereine",
      "Check-list vendeur : sécuriser chaque étape de votre transaction"
    ]
  },
  "vendeur-investisseur": {
    category: "marche",
    articles: [
      "Pourquoi certains biens perdent de la valeur malgré un marché en hausse",
      "Vendre un bien locatif : pièges fiscaux à éviter",
      "L'arbitrage immobilier : quand vendre pour mieux investir",
      "Comment la data (DVF + IA) peut maximiser votre retour sur investissement",
      "Cas pratique : optimiser une vente pour racheter plus grand"
    ]
  },
  "vendeur-sentimental": {
    category: "conseils",
    articles: [
      "Vendre une maison pleine de souvenirs : un parcours émotionnel",
      "Comment éviter de refuser toutes les offres par attachement affectif",
      "Valoriser votre bien sans le dénaturer",
      "Témoignages de familles qui ont franchi le cap sereinement",
      "Le rôle du conseiller comme médiateur émotionnel"
    ]
  },
  "vendeur-mal-informe": {
    category: "estimation",
    articles: [
      "Les mythes les plus répandus sur la valeur immobilière",
      "Pourquoi les estimations en ligne se trompent (et comment les corriger)",
      "Comprendre le prix au m² dans votre quartier",
      "L'impact réel des travaux sur le prix de vente",
      "10 questions à poser avant de choisir un agent immobilier"
    ]
  },
  "vendeur-exigeant": {
    category: "estimation",
    articles: [
      "Le vrai coût d'attendre \"l'acheteur parfait\"",
      "Pourquoi viser trop haut rallonge le délai de vente",
      "Comment prouver à un acheteur la valeur de votre prix",
      "Stratégies de négociation avancées pour propriétaires ambitieux",
      "Exemple : maison vendue au prix fort grâce à une mise en scène"
    ]
  },
  "vendeur-bloque": {
    category: "conseils",
    articles: [
      "Que faire si votre ex refuse de signer la vente",
      "Héritage : comment débloquer une indivision sans procès interminable",
      "Solutions de médiation pour vendre malgré un conflit",
      "Les alternatives si vous n'arrivez pas à vous mettre d'accord",
      "Témoignage : \"nous avons enfin vendu après 2 ans de blocage\""
    ]
  },
  "vendeur-opportuniste": {
    category: "conseils",
    articles: [
      "Est-ce vraiment le bon moment pour vendre en Gironde ?",
      "Les signaux du marché qui montrent une fenêtre de tir",
      "Comment tirer profit d'une tendance haussière",
      "Le piège de \"l'acheteur investisseur malin\"",
      "Guide express pour mettre en vente sans attendre"
    ]
  },
  "vendeur-autonome": {
    category: "conseils",
    articles: [
      "Les limites de la vente entre particuliers",
      "Comment éviter les arnaques en vendant seul",
      "Ce que les acheteurs regardent vraiment dans une annonce",
      "L'impact des diagnostics et de la législation (DPE, loi Carrez…)",
      "Quand faire appel à un pro même si vous vendez seul"
    ]
  },
  "vendeur-premium": {
    category: "conseils",
    articles: [
      "Pourquoi vendre un bien de luxe n'a rien à voir avec une vente classique",
      "Les attentes réelles des acheteurs haut de gamme",
      "L'importance de la mise en scène et du storytelling",
      "Comment préserver votre discrétion lors d'une vente premium",
      "Cas d'étude : villa vendue +12 % au-dessus du marché grâce à une stratégie dédiée"
    ]
  }
};

// Function to create SEO-friendly slug from title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ÿ]/g, 'y')
    .replace(/[ç]/g, 'c')
    .replace(/[²³]/g, '2')
    .replace(/[°]/g, '')
    .replace(/[€]/g, 'euros')
    .replace(/["«»"]/g, '')
    .replace(/[:]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Function to generate meta description from title
function generateMetaDescription(title, category) {
  const baseDescriptions = {
    "conseils": "Découvrez nos conseils d'expert pour ",
    "estimation": "Guide complet sur ",
    "marche": "Analyse du marché immobilier : "
  };
  
  const base = baseDescriptions[category] || "Guide immobilier : ";
  let description = base + title.toLowerCase();
  
  // Add location and call to action
  description += " en Gironde. Expertise immobilière, conseils pratiques et accompagnement personnalisé.";
  
  // Ensure description is under 160 characters
  if (description.length > 160) {
    description = description.substring(0, 157) + "...";
  }
  
  return description;
}

// Function to extract keywords from title
function extractKeywords(title, category) {
  const commonKeywords = ["immobilier", "gironde", "bordeaux", "vente"];
  const categoryKeywords = {
    "conseils": ["conseils", "guide", "vendeur"],
    "estimation": ["estimation", "prix", "valeur"],
    "marche": ["marché", "investissement", "analyse"]
  };
  
  // Extract key words from title
  const titleWords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['dans', 'pour', 'avec', 'sans', 'comment', 'pourquoi', 'votre', 'cette', 'tous'].includes(word));
  
  const keywords = [...new Set([
    ...commonKeywords,
    ...(categoryKeywords[category] || []),
    ...titleWords.slice(0, 3)
  ])];
  
  return JSON.stringify(keywords);
}

// Function to generate minimal draft content
function generateDraftContent(title, category, persona) {
  const personaDescriptions = {
    "vendeur-presse": "vendeurs qui ont besoin de vendre rapidement",
    "vendeur-prudent": "propriétaires qui cherchent sécurité et garanties",
    "vendeur-investisseur": "investisseurs immobiliers soucieux de rentabilité",
    "vendeur-sentimental": "propriétaires attachés émotionnellement à leur bien",
    "vendeur-mal-informe": "vendeurs qui manquent d'informations sur le marché",
    "vendeur-exigeant": "propriétaires qui visent le prix maximum",
    "vendeur-bloque": "vendeurs face à des situations complexes",
    "vendeur-opportuniste": "propriétaires qui profitent des opportunités du marché",
    "vendeur-autonome": "vendeurs qui préfèrent gérer leur vente",
    "vendeur-premium": "propriétaires de biens haut de gamme"
  };

  return `<h1>${title}</h1>

<p><em>Article en cours de rédaction - Version brouillon</em></p>

<p>Cet article s'adresse spécifiquement aux <strong>${personaDescriptions[persona]}</strong> en Gironde et dans la région bordelaise.</p>

<h2>Introduction</h2>
<p>Le marché immobilier en Gironde présente des spécificités qu'il est important de connaître avant de se lancer dans une transaction.</p>

<h2>Points clés à développer</h2>
<ul>
  <li>Analyse de la situation actuelle</li>
  <li>Conseils pratiques adaptés</li>
  <li>Exemples concrets en Gironde</li>
  <li>Solutions personnalisées</li>
</ul>

<h2>Conclusion</h2>
<p>Pour obtenir une estimation personnalisée et des conseils adaptés à votre situation, n'hésitez pas à contacter nos experts immobiliers spécialisés en Gironde.</p>

<p><em>Cet article sera complété avec du contenu détaillé, des données actualisées et des témoignages clients.</em></p>`;
}

// Generate all articles data
function generateAllArticles() {
  const articles = [];
  let articleCount = 0;
  
  for (const [persona, data] of Object.entries(articleData)) {
    for (const title of data.articles) {
      articleCount++;
      const slug = createSlug(title);
      const metaDescription = generateMetaDescription(title, data.category);
      const keywords = extractKeywords(title, data.category);
      const content = generateDraftContent(title, data.category, persona);
      const seoTitle = `${title} | Expert Immobilier Gironde`;
      
      articles.push({
        title,
        slug,
        metaDescription,
        content,
        summary: metaDescription,
        keywords,
        seoTitle,
        authorName: "Expert Immobilier",
        status: "draft",
        category: data.category
      });
      
      console.log(`${articleCount}/50 - Generated: ${title}`);
    }
  }
  
  return articles;
}

// Save articles to JSON file for review
function saveArticlesToFile() {
  const articles = generateAllArticles();
  
  // Save to JSON file
  fs.writeFileSync('article-drafts.json', JSON.stringify(articles, null, 2), 'utf8');
  
  console.log(`\n✅ Generated ${articles.length} article drafts`);
  console.log(`📁 Saved to: article-drafts.json`);
  
  // Generate summary
  const categories = articles.reduce((acc, article) => {
    acc[article.category] = (acc[article.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📊 Articles by category:');
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} articles`);
  });
  
  return articles;
}

// Run the generation
saveArticlesToFile();

export { generateAllArticles, saveArticlesToFile };