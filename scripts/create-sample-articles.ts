import { supabaseAdmin } from '../server/lib/supabaseAdmin';

// Articles d'exemple basés sur l'immobilier Gironde
const sampleArticles = [
  {
    title: "Villa Vendue 12% au-dessus du Marché Grâce à une Stratégie d'Excellence",
    slug: "cas-detude-villa-vendue-12-au-dessus-du-marche-grace-a-une-strategie-deleve",
    content: `
<h2>Cas d'étude : Villa exceptionnelle en Gironde</h2>

<p>Découvrez comment une stratégie de vente ciblée a permis de vendre cette villa de 280m² à Mérignac 12% au-dessus du prix de marché initial.</p>

<h3>📍 Localisation et contexte</h3>
<ul>
<li><strong>Commune :</strong> Mérignac (33700)</li>
<li><strong>Surface :</strong> 280m² habitables</li>
<li><strong>Terrain :</strong> 1200m² paysager</li>
<li><strong>Estimation initiale :</strong> 890 000€</li>
<li><strong>Prix de vente :</strong> 995 000€</li>
</ul>

<h3>🎯 Stratégie mise en place</h3>
<p>Notre approche s'est articulée autour de 3 axes majeurs :</p>
<ul>
<li><strong>Home staging premium</strong> : Réaménagement des espaces de vie</li>
<li><strong>Valorisation extérieure</strong> : Mise en valeur de la piscine et du jardin</li>
<li><strong>Communication ciblée</strong> : Diffusion vers une clientèle cadres supérieurs</li>
</ul>

<h3>💡 Résultats obtenus</h3>
<p>En 3 semaines seulement :</p>
<ul>
<li>47 demandes de visites</li>
<li>12 visites réalisées</li>
<li>3 offres d'achat reçues</li>
<li>Vente conclue à +12% du prix initial</li>
</ul>

<h3>🔑 Facteurs clés de succès</h3>
<p>Cette réussite s'explique par plusieurs éléments décisifs en Gironde :</p>
<ul>
<li>Timing optimal (printemps 2024)</li>
<li>Présentation irréprochable du bien</li>
<li>Prix de départ cohérent avec les attentes</li>
<li>Suivi personnalisé des prospects</li>
</ul>
    `,
  },
  {
    title: "Marché Immobilier Gironde : Analyse T3 2024 et Perspectives",
    slug: "marche-immobilier-gironde-analyse-t3-2024-perspectives",
    content: `
<h2>État du marché immobilier en Gironde</h2>

<p>Le troisième trimestre 2024 révèle des tendances contrastées sur le marché immobilier girondin. Analyse détaillée par secteur.</p>

<h3>📊 Chiffres clés T3 2024</h3>
<ul>
<li><strong>Bordeaux métropole :</strong> -3,2% en volume, +1,8% en prix</li>
<li><strong>Bassin d'Arcachon :</strong> -8,1% en volume, +2,4% en prix</li>
<li><strong>Libournais :</strong> +2,1% en volume, +0,7% en prix</li>
<li><strong>Médoc :</strong> +5,3% en volume, -1,2% en prix</li>
</ul>

<h3>🏠 Évolution par type de bien</h3>
<p><strong>Appartements :</strong></p>
<ul>
<li>Bordeaux centre : 4 850€/m² (stable)</li>
<li>Première couronne : 3 680€/m² (+2,1%)</li>
<li>Seconde couronne : 2 940€/m² (+1,5%)</li>
</ul>

<p><strong>Maisons individuelles :</strong></p>
<ul>
<li>Médian Gironde : 385 000€ (+1,8%)</li>
<li>Proche Bordeaux : 525 000€ (+0,9%)</li>
<li>Zones rurales : 285 000€ (+3,2%)</li>
</ul>

<h3>🔮 Perspectives Q4 2024</h3>
<p>Nos prévisions pour les trois prochains mois :</p>
<ul>
<li><strong>Taux d'intérêt :</strong> Stabilisation autour de 4,2%</li>
<li><strong>Offre :</strong> Léger redressement attendu</li>
<li><strong>Demande :</strong> Maintien des primo-accédants</li>
<li><strong>Prix :</strong> Ajustement modéré à la baisse (-1 à -2%)</li>
</ul>
    `,
  },
  {
    title: "Guide Complet : Estimer Gratuitement Votre Bien en Gironde",
    slug: "guide-complet-estimer-gratuitement-votre-bien-en-gironde",
    content: `
<h2>Estimation immobilière en Gironde : Le guide pratique</h2>

<p>Estimer précisément la valeur de votre bien immobilier en Gironde nécessite une approche méthodique. Découvrez nos conseils d'experts.</p>

<h3>🎯 Méthodes d'estimation fiables</h3>
<p><strong>1. Analyse comparative de marché</strong></p>
<ul>
<li>Recherche de biens similaires vendus récemment</li>
<li>Ajustements selon les spécificités de votre bien</li>
<li>Prise en compte de la localisation précise</li>
</ul>

<p><strong>2. Méthode par capitalisation du revenu</strong></p>
<ul>
<li>Applicable aux biens locatifs</li>
<li>Rendement brut moyen Gironde : 4,5% à 6%</li>
<li>Calcul : Loyer annuel ÷ Rendement attendu</li>
</ul>

<h3>📍 Spécificités géographiques Gironde</h3>
<p><strong>Bordeaux et métropole :</strong></p>
<ul>
<li>Forte variabilité selon les quartiers</li>
<li>Impact majeur du transport (tramway, bus)</li>
<li>Valorisation des rénovations énergétiques</li>
</ul>

<p><strong>Bassin d'Arcachon :</strong></p>
<ul>
<li>Saisonnalité marquée des transactions</li>
<li>Prime à la proximité des plages</li>
<li>Contraintes réglementaires spécifiques</li>
</ul>

<h3>💡 Outils d'estimation en ligne</h3>
<p>Avantages et limites des estimateurs automatiques :</p>
<ul>
<li><strong>Avantages :</strong> Rapidité, première approche, disponibilité 24h/24</li>
<li><strong>Limites :</strong> Imprécisions, données parfois obsolètes, absence d'expertise locale</li>
<li><strong>Conseil :</strong> Utilisez plusieurs outils et confrontez avec l'expertise professionnelle</li>
</ul>

<h3>🔧 Facteurs valorisants en Gironde</h3>
<ul>
<li>Proximité des transports en commun</li>
<li>Performance énergétique (DPE A-C)</li>
<li>Espaces extérieurs (terrasse, jardin, balcon)</li>
<li>Parking privatif (garage ou place)</li>
<li>Rénovations récentes (cuisine, salle de bain)</li>
</ul>
    `,
  },
  {
    title: "Investissement Locatif en Gironde : Secteurs Porteurs 2024",
    slug: "investissement-locatif-gironde-secteurs-porteurs-2024",
    content: `
<h2>Où investir en locatif en Gironde en 2024 ?</h2>

<p>Analyse des secteurs les plus prometteurs pour l'investissement locatif en Gironde, avec focus sur la rentabilité et les perspectives.</p>

<h3>🏆 Top 5 des communes rentables</h3>
<p><strong>1. Villenave-d'Ornon</strong></p>
<ul>
<li>Rendement brut moyen : 5,8%</li>
<li>Prix médian : 3 200€/m²</li>
<li>Atouts : Tramway, proximité Bordeaux, fiscalité attractive</li>
</ul>

<p><strong>2. Cenon</strong></p>
<ul>
<li>Rendement brut moyen : 6,2%</li>
<li>Prix médian : 2 850€/m²</li>
<li>Atouts : Renouvellement urbain, transport, prix abordables</li>
</ul>

<p><strong>3. Langon</strong></p>
<ul>
<li>Rendement brut moyen : 7,1%</li>
<li>Prix médian : 1 950€/m²</li>
<li>Atouts : Centre historique, train direct Bordeaux, potentiel</li>
</ul>

<h3>🎓 Investissement étudiant</h3>
<p><strong>Secteurs privilégiés :</strong></p>
<ul>
<li>Talence (proximité universités) : 5,2% de rendement</li>
<li>Pessac (campus, tramway) : 5,0% de rendement</li>
<li>Bordeaux centre (École de commerce) : 4,8% de rendement</li>
</ul>

<p><strong>Typologies recherchées :</strong></p>
<ul>
<li>Studios 20-25m² : forte demande</li>
<li>T2 meublés : colocation possible</li>
<li>Proximité transports indispensable</li>
</ul>

<h3>🏢 Investissement de rendement</h3>
<p><strong>Stratégies gagnantes 2024 :</strong></p>
<ul>
<li><strong>Rénovation énergétique :</strong> Aides maximisées, loyers revalorisés</li>
<li><strong>Colocation :</strong> +20% de rendement en moyenne</li>
<li><strong>Courte durée :</strong> Bassin d'Arcachon, forte saisonnalité</li>
<li><strong>Déficit foncier :</strong> Centres-villes à rénover</li>
</ul>

<h3>⚠️ Secteurs à éviter</h3>
<ul>
<li>Zones inondables sans protection</li>
<li>Copropriétés en difficulté</li>
<li>Secteurs sans transports</li>
<li>DPE F-G (interdiction location prochaine)</li>
</ul>
    `,
  },
  {
    title: "Succession Immobilière : Vendre Sans Stress en Gironde",
    slug: "succession-immobiliere-vendre-sans-stress-gironde",
    content: `
<h2>Gérer une succession immobilière en Gironde</h2>

<p>La vente d'un bien hérité nécessite de respecter des étapes précises. Guide complet pour sécuriser votre succession immobilière.</p>

<h3>📋 Étapes obligatoires</h3>
<p><strong>Phase 1 : Démarches administratives</strong></p>
<ul>
<li>Obtention de l'acte de notoriété (liste des héritiers)</li>
<li>Déclaration de succession (délai : 6 mois)</li>
<li>Évaluation du patrimoine pour les droits</li>
<li>Purge du droit de préemption si nécessaire</li>
</ul>

<p><strong>Phase 2 : Préparation à la vente</strong></p>
<ul>
<li>Accord unanime des héritiers (ou décision judiciaire)</li>
<li>Diagnostics immobiliers obligatoires</li>
<li>Estimation par professionnel agréé</li>
<li>Choix de la stratégie commerciale</li>
</ul>

<h3>💰 Optimisation fiscale</h3>
<p><strong>Calcul de la plus-value :</strong></p>
<ul>
<li>Base de calcul : Valeur au jour de la succession</li>
<li>Abattements : 6% par an après 6 ans de détention</li>
<li>Exonération totale après 30 ans</li>
<li>Résidence principale : abattement de 20%</li>
</ul>

<p><strong>Droits de succession :</strong></p>
<ul>
<li>Conjoint et PACS : exonération totale</li>
<li>Enfants : abattement 100 000€ chacun</li>
<li>Autres héritiers : barèmes dégressifs</li>
</ul>

<h3>🤝 Gestion de l'indivision</h3>
<p><strong>Solutions pratiques :</strong></p>
<ul>
<li><strong>Convention d'indivision :</strong> Règles claires, durée 5 ans max</li>
<li><strong>Vente amiable :</strong> Accord unanime requis</li>
<li><strong>Licitation :</strong> Vente forcée si blocage</li>
<li><strong>Attribution préférentielle :</strong> Un héritier rachète les parts</li>
</ul>

<h3>📞 Interlocuteurs en Gironde</h3>
<p><strong>Professionnels recommandés :</strong></p>
<ul>
<li>Notaires spécialisés succession (Bordeaux, Mérignac)</li>
<li>Experts immobiliers CEIF Gironde</li>
<li>Conseillers en gestion de patrimoine</li>
<li>Avocats en droit immobilier si conflit</li>
</ul>
    `,
  },
  {
    title: "Bordeaux Nord : Le Nouveau Quartier Qui Monte",
    slug: "bordeaux-nord-nouveau-quartier-qui-monte",
    content: `
<h2>Bordeaux Nord : Transformation et opportunités</h2>

<p>Le secteur Bordeaux Nord connaît une métamorphose urbaine spectaculaire. Analyse des transformations et des opportunités immobilières.</p>

<h3>🚧 Grands projets en cours</h3>
<p><strong>Aménagement des Bassins à Flot :</strong></p>
<ul>
<li>3 500 nouveaux logements prévus</li>
<li>Base sous-marine rénovée (centre culturel)</li>
<li>Promenade des quais réaménagée</li>
<li>Nouveaux équipements (écoles, commerces)</li>
</ul>

<p><strong>Reconversion urbaine Bacalan :</strong></p>
<ul>
<li>Ancien quartier industriel réhabilité</li>
<li>Architecture contemporaine remarquable</li>
<li>Pont Chaban-Delmas (liaison directe centre)</li>
<li>Cité du Vin (attractivité touristique)</li>
</ul>

<h3>📈 Évolution des prix</h3>
<p><strong>Tendances 2022-2024 :</strong></p>
<ul>
<li>2022 : 3 100€/m² (appartements neufs)</li>
<li>2023 : 3 450€/m² (+11,3%)</li>
<li>2024 : 3 780€/m² (+9,6%)</li>
<li>Prévision 2025 : 4 100€/m² (+8,5%)</li>
</ul>

<p><strong>Comparaison avec Bordeaux centre :</strong></p>
<ul>
<li>Écart de prix : -35% en moyenne</li>
<li>Rattrapage progressif attendu</li>
<li>Potentiel d'appréciation : +40% d'ici 5 ans</li>
</ul>

<h3>🚇 Transports et accessibilité</h3>
<p><strong>Desserte actuelle :</strong></p>
<ul>
<li>Tramway C (Cité du Vin - Gare Saint-Jean)</li>
<li>Bus ligne 7 (liaison directe centre-ville)</li>
<li>Pont Chaban-Delmas (accès rive droite)</li>
<li>Parking-relais (P+R Buttinière)</li>
</ul>

<p><strong>Projets futurs :</strong></p>
<ul>
<li>Extension tramway vers Eysines (2026)</li>
<li>Nouvelle passerelle piétonne (2025)</li>
<li>Pistes cyclables sécurisées</li>
</ul>

<h3>🎯 Profil acquéreurs</h3>
<p><strong>Primo-accédants (45%) :</strong></p>
<ul>
<li>Budget moyen : 280 000€ - 350 000€</li>
<li>Recherche : T3-T4 avec extérieur</li>
<li>Critères : proximité transports, écoles</li>
</ul>

<p><strong>Investisseurs (35%) :</strong></p>
<ul>
<li>Rendement locatif : 4,2% - 5,8%</li>
<li>Location étudiante/jeunes actifs</li>
<li>Potentiel de plus-value important</li>
</ul>
    `,
  }
];

async function createSampleArticles() {
  try {
    console.log('🚀 Création des articles d\'exemple dans Supabase...');
    
    // Vérifier les articles existants
    const { data: existingArticles, error: checkError } = await supabaseAdmin
      .from('articles')
      .select('slug');
    
    if (checkError) {
      console.error('❌ Erreur vérification:', checkError);
      return;
    }
    
    const existingSlugs = new Set(existingArticles?.map(a => a.slug) || []);
    console.log(`📊 ${existingArticles?.length || 0} article(s) déjà présent(s)`);
    
    // Filtrer les articles à créer
    const articlesToCreate = sampleArticles.filter(article => !existingSlugs.has(article.slug));
    
    if (articlesToCreate.length === 0) {
      console.log('✅ Tous les articles d\'exemple existent déjà !');
      return;
    }
    
    console.log(`🎯 Création de ${articlesToCreate.length} nouvel(s) article(s)`);
    
    // Créer les articles un par un
    let successCount = 0;
    
    for (const article of articlesToCreate) {
      try {
        console.log(`📝 Création: "${article.title}"...`);
        
        const { error: insertError } = await supabaseAdmin
          .from('articles')
          .insert(article);
        
        if (insertError) {
          console.error(`❌ Erreur "${article.title}":`, insertError);
          
          // Si erreur, essayons avec encore moins de colonnes
          const minimalArticle = {
            title: article.title,
            slug: article.slug,
            content: article.content.substring(0, 500) // Contenu tronqué si trop long
          };
          
          const { error: error2 } = await supabaseAdmin
            .from('articles')
            .insert(minimalArticle);
          
          if (error2) {
            console.error(`❌ Erreur minimal "${article.title}":`, error2);
          } else {
            console.log(`✅ "${article.title}" créé (version minimale)`);
            successCount++;
          }
        } else {
          console.log(`✅ "${article.title}" créé avec succès`);
          successCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`💥 Erreur "${article.title}":`, error);
      }
    }
    
    console.log(`\n🎉 ${successCount} article(s) créé(s) !`);
    
    // Vérification finale
    const { data: finalArticles } = await supabaseAdmin
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`\n📊 Total articles: ${finalArticles?.length || 0}`);
    
    if (finalArticles && finalArticles.length > 0) {
      console.log('\n📋 Articles créés :');
      finalArticles.slice(0, 6).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
      });
      
      console.log('\n🔍 Structure du premier article :');
      console.log(Object.keys(finalArticles[0]));
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

// Execute automatically
createSampleArticles()
  .then(() => {
    console.log('\n🏁 Création des articles terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { createSampleArticles };