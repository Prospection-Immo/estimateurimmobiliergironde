import { supabaseAdmin } from '../server/lib/supabaseAdmin';

// Guides très basiques avec colonnes minimales
const basicGuides = [
  {
    title: "Guide Vente Rapide - Vendeur Pressé",
    slug: "guide-vente-rapide-vendeur-presse",
    content: "Guide pour vendre rapidement sans brader en Gironde. Stratégies éprouvées pour une vente express.",
  },
  {
    title: "Guide Maximisation Prix - Optimiser sa Plus-Value",
    slug: "guide-maximisation-prix-optimiser-plus-value",
    content: "Techniques d'expert pour obtenir le meilleur prix et maximiser votre plus-value immobilière en Gironde.",
  },
  {
    title: "Guide Succession - Vendre un Bien Hérité",
    slug: "guide-succession-vendre-bien-herite",
    content: "Accompagnement complet pour la vente d'un bien en succession : démarches, fiscalité, optimisation.",
  },
  {
    title: "Guide Nouvelle Vie - Vendre pour Déménager",
    slug: "guide-nouvelle-vie-vendre-demenager",
    content: "Conseils pour vendre sereinement en vue d'un déménagement : timing, logistique, nouveau projet.",
  },
  {
    title: "Guide Investisseur - Optimiser sa Vente Locative",
    slug: "guide-investisseur-optimiser-vente-locative",
    content: "Stratégies d'investisseur pour optimiser la vente d'un bien locatif : fiscalité, timing, réinvestissement.",
  },
  {
    title: "Guide Primo-Accédant - Première Vente Immobilière",
    slug: "guide-primo-accedant-premiere-vente",
    content: "Guide complet pour réussir sa première vente immobilière : étapes, pièges à éviter, accompagnement.",
  }
];

async function createBasicGuides() {
  try {
    console.log('🚀 Création des guides basiques...');
    
    let successCount = 0;
    
    for (const guide of basicGuides) {
      try {
        console.log(`📝 Création: "${guide.title}"...`);
        
        const { data, error } = await supabaseAdmin
          .from('guides')
          .insert(guide)
          .select();
        
        if (error) {
          console.error(`❌ Erreur "${guide.title}":`, error);
          
          // Si erreur, essayons avec encore moins de colonnes
          const minimalGuide = {
            title: guide.title,
            slug: guide.slug
          };
          
          const { data: data2, error: error2 } = await supabaseAdmin
            .from('guides')
            .insert(minimalGuide)
            .select();
          
          if (error2) {
            console.error(`❌ Erreur minimal "${guide.title}":`, error2);
          } else {
            console.log(`✅ "${guide.title}" créé (version minimale)`);
            successCount++;
          }
        } else {
          console.log(`✅ "${guide.title}" créé avec succès`);
          successCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`💥 Erreur "${guide.title}":`, error);
      }
    }
    
    console.log(`\n🎉 ${successCount} guide(s) créé(s) !`);
    
    // Vérification finale
    const { data: finalGuides } = await supabaseAdmin
      .from('guides')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`\n📊 Total guides: ${finalGuides?.length || 0}`);
    
    if (finalGuides && finalGuides.length > 0) {
      console.log('\n📋 Guides créés :');
      finalGuides.forEach((guide, index) => {
        console.log(`  ${index + 1}. ${guide.title}`);
      });
      
      console.log('\n🔍 Structure du premier guide :');
      console.log(Object.keys(finalGuides[0]));
    }
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

// Execute automatically
createBasicGuides()
  .then(() => {
    console.log('\n🏁 Création terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });

export { createBasicGuides };