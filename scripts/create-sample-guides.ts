import { supabaseAdmin } from '../server/lib/supabaseAdmin';

// Guides d'exemple basés sur les 6 personas
const sampleGuides = [
  {
    id: "guide-presse-vente-rapide",
    title: "Guide Vente Rapide - Vendeur Pressé",
    slug: "guide-vente-rapide-vendeur-presse",
    persona: "presse",
    short_benefit: "Vendre rapidement sans brader : stratégies éprouvées pour une vente express en Gironde",
    reading_time: 15,
    content: `
<h2>Vendre rapidement en Gironde : Mode d'emploi</h2>

<h3>🚀 Stratégies pour une vente express</h3>
<p>Vous avez besoin de vendre rapidement ? Voici comment optimiser votre vente sans compromettre le prix :</p>

<ul>
<li><strong>Prix attractif dès le départ</strong> : Positionnez-vous 5-8% sous le marché pour créer l'urgence</li>
<li><strong>Photos professionnelles</strong> : Investissez dans un photographe immobilier</li>
<li><strong>Disponibilité maximale</strong> : Visites 7j/7 et créneaux larges</li>
<li><strong>Communication intensive</strong> : Diffusion sur tous les portails immobiliers</li>
</ul>

<h3>📍 Spécificités Gironde</h3>
<p>En Gironde, certaines communes se vendent plus rapidement :</p>
<ul>
<li>Bordeaux centre : 15-30 jours</li>
<li>Mérignac, Pessac : 20-40 jours</li>
<li>Bassin d'Arcachon : Variable selon saison</li>
</ul>

<h3>⚠️ Pièges à éviter</h3>
<ul>
<li>Prix trop bas par panique</li>
<li>Refuser les premières offres légèrement inférieures</li>
<li>Négliger la présentation du bien</li>
</ul>

<h3>💡 Conseils d'expert</h3>
<p>Un bien bien présenté au bon prix se vend en moyenne 2x plus vite en Gironde. Notre équipe vous accompagne pour optimiser chaque étape.</p>
    `,
    summary: "Stratégies de vente express, prix optimal, timing Gironde, éviter les pièges",
    pdf_content: `
<h2>BONUS PDF : Checklist Vente Rapide</h2>
<ul>
<li>✅ Estimation prix marché -5%</li>
<li>✅ Photos HD réalisées</li>
<li>✅ Annonces diffusées (5+ sites)</li>
<li>✅ Disponibilité visites organisée</li>
<li>✅ Diagnostics à jour</li>
<li>✅ Négociation préparée</li>
</ul>
    `,
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center",
    meta_description: "Guide expert pour vendre rapidement son bien immobilier en Gironde. Stratégies éprouvées, prix optimal, timing spécifique Bordeaux.",
    seo_title: "Guide Vente Rapide Immobilier Gironde | Conseils Expert Bordeaux",
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "guide-maximisateur-prix",
    title: "Guide Maximisation Prix - Optimiser sa Plus-Value",
    slug: "guide-maximisation-prix-optimiser-plus-value",
    persona: "maximisateur", 
    short_benefit: "Techniques d'expert pour obtenir le meilleur prix et maximiser votre plus-value immobilière",
    reading_time: 25,
    content: `
<h2>Maximiser le prix de vente en Gironde</h2>

<h3>💰 Stratégies de valorisation</h3>
<p>Pour obtenir le meilleur prix, chaque détail compte :</p>

<ul>
<li><strong>Micro-rénovations rentables</strong> : ROI > 150%</li>
<li><strong>Home staging professionnel</strong> : +8% de plus-value moyenne</li>
<li><strong>Timing optimal</strong> : Printemps/début été en Gironde</li>
<li><strong>Négociation maîtrisée</strong> : Techniques de vente immobilière</li>
</ul>

<h3>🏡 Rénovations rentables spécial Gironde</h3>
<ul>
<li>Cuisine : +12% de valeur (budget 8-15k€)</li>
<li>Salle de bain : +8% de valeur (budget 5-10k€)</li>
<li>Extérieur/terrasse : +6% (important pour le climat girondin)</li>
<li>Isolation/chauffage : +5% + économies futures</li>
</ul>

<h3>📈 Analyse marché Gironde</h3>
<p>Prix médian 2024 par secteur :</p>
<ul>
<li>Bordeaux centre : 4500-6000€/m²</li>
<li>Communes limitrophes : 3200-4200€/m²</li>
<li>Bassin d'Arcachon : 5000-8000€/m² (selon proximité mer)</li>
</ul>

<h3>🎯 Stratégie négociation</h3>
<p>En Gironde, 78% des biens se négocient. Techniques pour limiter la baisse :</p>
<ul>
<li>Justifier votre prix par comparables récents</li>
<li>Mettre en avant les atouts uniques</li>
<li>Créer une émulation entre acheteurs</li>
</ul>
    `,
    summary: "Rénovations rentables, home staging, timing optimal, négociation expert, marché Gironde",
    pdf_content: `
<h2>BONUS PDF : Calculateur Plus-Value</h2>
<p>Outil Excel pour calculer le ROI de vos rénovations + 15 exemples de rénovations rentables en Gironde avec photos avant/après.</p>
    `,
    image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop&crop=center",
    meta_description: "Guide expert maximisation prix vente immobilière Gironde. Rénovations rentables, home staging, négociation. +15% de plus-value.",
    seo_title: "Maximiser Prix Vente Immobilier Gironde | Guide Expert Plus-Value",
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "guide-succession-heritage",
    title: "Guide Succession - Vendre un Bien Hérité",
    slug: "guide-succession-vendre-bien-herite",
    persona: "succession",
    short_benefit: "Accompagnement complet pour la vente d'un bien en succession : démarches, fiscalité, optimisation",
    reading_time: 30,
    content: `
<h2>Vendre un bien en succession en Gironde</h2>

<h3>📋 Démarches obligatoires</h3>
<p>Étapes indispensables avant la vente :</p>

<ul>
<li><strong>Acte de notoriété</strong> : Identification des héritiers</li>
<li><strong>Déclaration de succession</strong> : Dans les 6 mois</li>
<li><strong>Partage ou indivision</strong> : Accord entre héritiers</li>
<li><strong>Purge du droit de préemption</strong> : Commune/locataires</li>
</ul>

<h3>💰 Optimisation fiscale</h3>
<p>Spécificités succession immobilière :</p>
<ul>
<li>Abattement résidence principale : 20% sur valeur vénale</li>
<li>Plus-value : Base = valeur succession (pas prix achat initial)</li>
<li>Exonération si détention > 30 ans</li>
<li>Stratégies de démembrement en amont</li>
</ul>

<h3>🏠 Estimation bien succession Gironde</h3>
<p>Particularités régionales :</p>
<ul>
<li>Anciennes maisons bordelaises : Expertise patrimoine nécessaire</li>
<li>Vignobles/propriétés viticoles : Évaluation spécialisée</li>
<li>Biens côtiers : Forte valorisation mais contraintes réglementaires</li>
</ul>

<h3>👥 Gestion indivision</h3>
<p>Solutions pratiques :</p>
<ul>
<li>Convention d'indivision : Protection et règles claires</li>
<li>Vente amiable : Accord unanime requis</li>
<li>Licitation judiciaire : En cas de blocage</li>
</ul>

<h3>⚖️ Conseils juridiques Gironde</h3>
<p>Professionnels recommandés :</p>
<ul>
<li>Notaires spécialisés succession Bordeaux</li>
<li>Experts fonciers CEIF Gironde</li>
<li>Conseillers patrimoniaux agréés</li>
</ul>
    `,
    summary: "Démarches succession, fiscalité optimisée, gestion indivision, experts Gironde",
    pdf_content: `
<h2>BONUS PDF : Kit Succession Immobilière</h2>
<ul>
<li>📄 Checklist complète des démarches</li>
<li>📊 Simulateur fiscalité succession</li>
<li>📞 Annuaire professionnels Gironde</li>
<li>📝 Modèles conventions d'indivision</li>
</ul>
    `,
    image_url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop&crop=center",
    meta_description: "Guide complet vente bien succession Gironde. Démarches, fiscalité, indivision. Experts notaires Bordeaux.",
    seo_title: "Vendre Bien Succession Gironde | Guide Expert Héritage Bordeaux",
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "guide-nouvelle-vie-demenagement",
    title: "Guide Nouvelle Vie - Vendre pour Déménager",
    slug: "guide-nouvelle-vie-vendre-demenager",
    persona: "nouvelle_vie",
    short_benefit: "Conseils pour vendre sereinement en vue d'un déménagement : timing, logistique, nouveau projet",
    reading_time: 20,
    content: `
<h2>Vendre pour une nouvelle vie : Guide pratique</h2>

<h3>📅 Orchestrer sa vente-achat</h3>
<p>Synchroniser parfaitement vos projets :</p>

<ul>
<li><strong>Vente en premier</strong> : Sécurise le financement du nouveau projet</li>
<li><strong>Achat conditionnel</strong> : Clause suspensive de vente</li>
<li><strong>Solution de transition</strong> : Location temporaire si besoin</li>
<li><strong>Prêt relais</strong> : Financement pont (solution coûteuse)</li>
</ul>

<h3>🚚 Logistique déménagement</h3>
<p>Optimiser la transition :</p>
<ul>
<li>Déménageurs Gironde : Devis 2 mois avant</li>
<li>Garde-meubles Bordeaux : Solutions temporaires</li>
<li>Home staging partiel : Conserver l'âme du lieu</li>
<li>Visites organisées : Minimiser les contraintes</li>
</ul>

<h3>💡 Spécial retraités Gironde</h3>
<p>Tendances migration retraite :</p>
<ul>
<li>Bordeaux → Bassin d'Arcachon : Cadre de vie</li>
<li>Ville → Campagne girondine : Économies</li>
<li>Maison → Appartement : Moins d'entretien</li>
<li>Résidence senior : Services intégrés</li>
</ul>

<h3>🏡 Adaptation nouveau projet</h3>
<p>Critères évolutifs selon l'âge :</p>
<ul>
<li>Accessibilité : Plain-pied, ascenseur</li>
<li>Proximité services : Santé, commerces</li>
<li>Transports : TCU Bordeaux, trains régionaux</li>
<li>Fiscalité locale : Comparaison taxes foncières Gironde</li>
</ul>

<h3>🎯 Stratégie négociation adaptée</h3>
<p>Vente motivée mais non pressée :</p>
<ul>
<li>Transparence sur votre projet</li>
<li>Délais flexibles pour l'acheteur</li>
<li>Faciliter les démarches administratives</li>
<li>Accompagnement personnalisé</li>
</ul>
    `,
    summary: "Vente-achat synchronisé, logistique déménagement, projets retraite, Gironde",
    pdf_content: `
<h2>BONUS PDF : Planner Déménagement</h2>
<ul>
<li>📅 Rétroplanning 6 mois</li>
<li>📋 Checklist administrative</li>
<li>📞 Contacts déménageurs Gironde</li>
<li>💰 Simulateur coûts transition</li>
</ul>
    `,
    image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop&crop=center",
    meta_description: "Guide vente immobilière déménagement Gironde. Vente-achat synchronisé, logistique, projets retraite Bordeaux.",
    seo_title: "Vendre pour Déménager Gironde | Guide Nouvelle Vie Bordeaux",
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "guide-investisseur-optimisation",
    title: "Guide Investisseur - Optimiser sa Vente Locative",
    slug: "guide-investisseur-optimiser-vente-locative",
    persona: "investisseur",
    short_benefit: "Stratégies d'investisseur pour optimiser la vente d'un bien locatif : fiscalité, timing, réinvestissement",
    reading_time: 35,
    content: `
<h2>Vendre un investissement locatif en Gironde</h2>

<h3>🧮 Optimisation fiscale investisseur</h3>
<p>Maîtriser l'impact fiscal de votre vente :</p>

<ul>
<li><strong>Plus-value immobilière</strong> : Abattement 6% par an après 6 ans</li>
<li><strong>Amortissements récupérés</strong> : Taxation au taux marginal</li>
<li><strong>Report d'imposition</strong> : Réinvestissement locatif</li>
<li><strong>Article 150-0 B ter</strong> : Exonération sous conditions</li>
</ul>

<h3>📊 Analyse rentabilité Gironde</h3>
<p>Rendements moyens par secteur (2024) :</p>
<ul>
<li>Bordeaux centre : 3,5-4,2% brut</li>
<li>Bordeaux périphérie : 4,5-5,5% brut</li>
<li>Villes moyennes Gironde : 5,5-7% brut</li>
<li>Investissement étudiant : 5-6% (risque vacance)</li>
</ul>

<h3>🏠 Valorisation bien locatif</h3>
<p>Spécificités vente avec locataire :</p>
<ul>
<li>Bien occupé : Décote 5-10% mais vente plus facile</li>
<li>Bail commercial : Valorisation du fonds de commerce</li>
<li>Congé pour vente : Délais réglementaires</li>
<li>Droit de préemption locataire : Procédure obligatoire</li>
</ul>

<h3>🎯 Stratégies réinvestissement</h3>
<p>Optimiser votre nouveau projet :</p>
<ul>
<li>Échange standard : Article 1031 CGI</li>
<li>Déficit foncier : Déduction revenus globaux</li>
<li>Monuments historiques : Déduction totale</li>
<li>LMNP/LMP : Statuts professionnels</li>
</ul>

<h3>🚀 Tendances investissement Gironde</h3>
<p>Opportunités actuelles :</p>
<ul>
<li>Rénovation énergétique : Aides maximisées</li>
<li>Colocation étudiante : Forte demande Bordeaux</li>
<li>Résidences seniors : Marché en expansion</li>
<li>Bureaux périurbains : Télétravail post-COVID</li>
</ul>
    `,
    summary: "Fiscalité plus-value, rendements Gironde, vente avec locataire, stratégies réinvestissement",
    pdf_content: `
<h2>BONUS PDF : Kit Investisseur Pro</h2>
<ul>
<li>📊 Calculateur plus-value/fiscalité</li>
<li>📈 Tableaux rendements Gironde</li>
<li>📝 Modèles congés réglementaires</li>
<li>💼 Stratégies réinvestissement fiscalement optimisées</li>
</ul>
    `,
    image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=center",
    meta_description: "Guide vente investissement locatif Gironde. Fiscalité optimisée, plus-value, rendements Bordeaux, réinvestissement.",
    seo_title: "Vente Investissement Locatif Gironde | Guide Fiscal Bordeaux",
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "guide-primo-accedant-vente",
    title: "Guide Primo-Accédant - Première Vente Immobilière",
    slug: "guide-primo-accedant-premiere-vente",
    persona: "primo",
    short_benefit: "Guide complet pour réussir sa première vente immobilière : étapes, pièges à éviter, accompagnement",
    reading_time: 18,
    content: `
<h2>Votre première vente immobilière en Gironde</h2>

<h3>📚 Les étapes de A à Z</h3>
<p>Processus complet pour débutants :</p>

<ul>
<li><strong>Estimation gratuite</strong> : 3 avis pour validation prix</li>
<li><strong>Diagnostic immobilier</strong> : Obligatoires et coûts (800-1500€)</li>
<li><strong>Stratégie commerciale</strong> : Choix agence ou particulier</li>
<li><strong>Négociation</strong> : Techniques de base et limites</li>
<li><strong>Compromis/acte</strong> : Étapes juridiques sécurisées</li>
</ul>

<h3>💰 Budget vente réaliste</h3>
<p>Coûts à prévoir en Gironde :</p>
<ul>
<li>Diagnostics : 800-1500€ selon superficie</li>
<li>Agence immobilière : 4-7% TTC du prix</li>
<li>Notaire (si achat simultané) : 2-3% nouveau</li>
<li>Plus-value (si applicable) : 19% + prélèvements sociaux</li>
</ul>

<h3>⚠️ Pièges classiques débutants</h3>
<p>Erreurs fréquentes à éviter :</p>
<ul>
<li>Prix irréaliste (trop haut ou trop bas)</li>
<li>Photos de mauvaise qualité</li>
<li>Annonce incomplète ou peu attractive</li>
<li>Disponibilité insuffisante pour visites</li>
<li>Négociation émotionnelle</li>
</ul>

<h3>🎯 Spécial jeunes propriétaires</h3>
<p>Contexte Gironde pour 25-35 ans :</p>
<ul>
<li>Revente après 5-7 ans : Tendance mobilité pro</li>
<li>Appartements Bordeaux : Forte demande locative</li>
<li>Maisons périphérie : Évolution famille</li>
<li>Plus-value modérée : Durée détention courte</li>
</ul>

<h3>🤝 Accompagnement personnalisé</h3>
<p>Notre support spécial primo-vendeurs :</p>
<ul>
<li>Estimation gratuite et expliquée</li>
<li>Coaching négociation</li>
<li>Suivi administratif simplifié</li>
<li>Réponses à toutes vos questions</li>
</ul>

<h3>📱 Outils numériques 2024</h3>
<p>Applications utiles en Gironde :</p>
<ul>
<li>DVF : Prix réels de vente</li>
<li>Géoportail : Urbanisme et contraintes</li>
<li>Apps agences : Suivi temps réel</li>
<li>Simulateurs fiscaux en ligne</li>
</ul>
    `,
    summary: "Première vente étapes, budget réaliste, pièges débutants, accompagnement personnalisé",
    pdf_content: `
<h2>BONUS PDF : Mémo Primo-Vendeur</h2>
<ul>
<li>📋 Checklist chronologique</li>
<li>💰 Calculateur coûts vente</li>
<li>📞 Contacts pros Gironde vérifiés</li>
<li>❓ FAQ 50 questions/réponses</li>
</ul>
    `,
    image_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop&crop=center",
    meta_description: "Guide première vente immobilière Gironde. Étapes détaillées, budget, pièges éviter. Accompagnement primo-vendeur Bordeaux.",
    seo_title: "Première Vente Immobilière Gironde | Guide Primo-Vendeur Bordeaux",
    is_active: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function createSampleGuides() {
  try {
    console.log('🚀 Création des guides d\'exemple dans Supabase...');
    
    // Vérifier les guides existants
    const { data: existingGuides, error: checkError } = await supabaseAdmin
      .from('guides')
      .select('slug');
    
    if (checkError) {
      console.error('❌ Erreur vérification:', checkError);
      return;
    }
    
    const existingSlugs = new Set(existingGuides?.map(g => g.slug) || []);
    console.log(`📊 ${existingGuides?.length || 0} guide(s) déjà présent(s)`);
    
    // Filtrer les guides à créer
    const guidesToCreate = sampleGuides.filter(guide => !existingSlugs.has(guide.slug));
    
    if (guidesToCreate.length === 0) {
      console.log('✅ Tous les guides d\'exemple existent déjà !');
      return;
    }
    
    console.log(`🎯 Création de ${guidesToCreate.length} nouveau(x) guide(s)`);
    
    // Créer les guides un par un
    let successCount = 0;
    
    for (const guide of guidesToCreate) {
      try {
        console.log(`📝 Création: "${guide.title}"...`);
        
        const { error: insertError } = await supabaseAdmin
          .from('guides')
          .insert(guide);
        
        if (insertError) {
          console.error(`❌ Erreur "${guide.title}":`, insertError);
        } else {
          console.log(`✅ "${guide.title}" créé avec succès`);
          successCount++;
        }
        
        // Pause entre créations
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`💥 Erreur "${guide.title}":`, error);
      }
    }
    
    console.log(`\n🎉 ${successCount} guide(s) créé(s) avec succès !`);
    
    // Vérification finale
    const { data: finalGuides } = await supabaseAdmin
      .from('guides')
      .select('title, persona, slug')
      .order('sort_order', { ascending: true });
    
    console.log(`\n📊 Total guides Supabase: ${finalGuides?.length || 0}`);
    
    if (finalGuides) {
      console.log('\n📋 Guides disponibles :');
      finalGuides.forEach((guide, index) => {
        console.log(`  ${index + 1}. ${guide.title} (${guide.persona})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Execute automatically
createSampleGuides()
  .then(() => {
    console.log('\n🏁 Création des guides terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { createSampleGuides };