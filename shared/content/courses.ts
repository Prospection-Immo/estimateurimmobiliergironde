// =============================================================================
// FORMATIONS PREMIUM - CONTENU MARKETING & COPYWRITING
// =============================================================================

export interface CourseContent {
  sku: string;
  slug: string;
  title: string;
  subtitle: string;
  priceEuros: number; // Prix en euros
  hero: {
    h1: string;
    hook: string;
    proof?: string;
    bulletPoints: string[];
  };
  sections: {
    learn: {
      title: string;
      items: string[];
    };
    deliverables: {
      title: string;
      items: string[];
    };
    guarantee: string;
    faq: {
      question: string;
      answer: string;
    }[];
  };
  cta: {
    label: string;
    subtext: string;
  };
  benefits: string[];
  testimonial?: {
    name: string;
    text: string;
    result: string;
  };
}

export const coursesContent: Record<string, CourseContent> = {
  ESTIMER47: {
    sku: "ESTIMER47",
    slug: "estimer-bien",
    title: "Les bases de l'estimation immobilière",
    subtitle: "Méthode simple pour débuter",
    priceEuros: 47,
    hero: {
      h1: "Apprenez les bases pour estimer votre bien vous-même",
      hook: "Beaucoup de propriétaires ne savent pas par où commencer pour estimer leur bien. Cette formation vous donne les bases essentielles.",
      bulletPoints: [
        "✅ Comprendre les bases de l'estimation",
        "✅ Utiliser les outils gratuits disponibles",
        "✅ Éviter les erreurs courantes de débutant", 
        "✅ Avoir une première idée du prix de votre bien"
      ]
    },
    sections: {
      learn: {
        title: "Ce que vous allez apprendre",
        items: [
          "Comment utiliser les outils gratuits (DVF, sites immobiliers)",
          "Les critères de base à regarder (surface, localisation, état)",
          "Comment comparer votre bien avec d'autres similaires",
          "Les erreurs classiques à éviter quand on débute",
          "Avoir une première fourchette de prix réaliste"
        ]
      },
      deliverables: {
        title: "Ce que vous recevez",
        items: [
          "🎥 Vidéos explicatives simples (1h30)",
          "📋 Liste des sites gratuits à consulter",
          "📊 Modèle de comparaison basic",
          "💡 2 exemples concrets en Gironde"
        ]
      },
      guarantee: "Satisfait ou remboursé sous 7 jours.",
      faq: [
        {
          question: "Est-ce adapté aux débutants ?",
          answer: "Oui, c'est fait pour débuter. Pas de pré-requis techniques."
        },
        {
          question: "Combien de temps ça prend ?",
          answer: "1h30 de vidéos à regarder à votre rythme."
        }
      ]
    },
    cta: {
      label: "Obtenir la formation – 47€",
      subtext: "Paiement sécurisé - Accès immédiat"
    },
    benefits: [
      "Apprenez les bases",
      "Évitez les erreurs courantes", 
      "Utilisez les outils gratuits",
      "Formation simple et accessible"
    ]
  },

  ANNONCE37: {
    sku: "ANNONCE37",
    slug: "annonce-immobiliere", 
    title: "Rédiger une annonce immobilière",
    subtitle: "Les bases pour bien présenter son bien",
    priceEuros: 37,
    hero: {
      h1: "Apprenez à rédiger votre première annonce immobilière",
      hook: "Une bonne annonce attire plus de visites. Cette formation vous montre comment faire une annonce claire et attractive.",
      bulletPoints: [
        "✅ Titre clair et accrocheur",  
        "✅ Description honnête de votre bien",
        "✅ Photos et présentation de base",
        "✅ Éviter les erreurs qui repoussent"
      ]
    },
    sections: {
      learn: {
        title: "Ce que vous allez apprendre",
        items: [
          "Écrire un titre qui attire sans mentir",
          "Décrire votre bien de façon claire et honnête",
          "Choisir les bonnes photos (même avec un téléphone)",
          "Éviter les erreurs qui font fuir les visiteurs",
          "Mettre en valeur les points forts de votre bien"
        ]
      },
      deliverables: {
        title: "Ce que vous recevez",
        items: [
          "🎥 Vidéos simples (1h)",
          "📝 Exemples d'annonces bien rédigées",
          "📋 Check-list des erreurs à éviter",
          "💡 Conseils photos de base"
        ]
      },
      guarantee: "Satisfait ou remboursé sous 7 jours.",
      faq: [
        {
          question: "Faut-il être bon en rédaction ?",
          answer: "Non, on vous donne des modèles simples à adapter."
        },
        {
          question: "Ça marche pour tous les types de biens ?",
          answer: "Oui, les bases restent les mêmes pour maisons et appartements."
        }
      ]
    },
    cta: {
      label: "Obtenir la formation – 37€", 
      subtext: "Paiement sécurisé - Accès immédiat"
    },
    benefits: [
      "Annonces plus claires",
      "Évitez les erreurs courantes",
      "Attirez plus de visites",
      "Méthode simple à appliquer"
    ]
  },

  VISITES29: {
    sku: "VISITES29", 
    slug: "organiser-visites",
    title: "Organiser les visites",
    subtitle: "Les bases pour bien recevoir",
    priceEuros: 29,
    hero: {
      h1: "Apprenez à organiser vos premières visites",
      hook: "Recevoir des visiteurs chez soi demande un minimum de préparation. Cette formation vous donne les bases.",
      bulletPoints: [
        "✅ Préparer votre bien avant les visites",
        "✅ Poser les bonnes questions aux visiteurs",
        "✅ Éviter les erreurs de débutant", 
        "✅ Organiser vos rendez-vous efficacement"
      ]
    },
    sections: {
      learn: {
        title: "Ce que vous allez apprendre",
        items: [
          "Préparer votre bien avant les visites",
          "Poser des questions simples aux visiteurs", 
          "Organiser vos rendez-vous",
          "Éviter les erreurs de débutant"
        ]
      },
      deliverables: {
        title: "Ce que vous recevez",
        items: [
          "🎥 Vidéos courtes (45min)",
          "📋 Check-list de préparation",
          "💡 Questions à poser aux visiteurs",
          "📅 Conseils organisation"
        ]
      },
      guarantee: "Satisfait ou remboursé sous 7 jours.",
      faq: [
        {
          question: "C'est adapté aux débutants ?",
          answer: "Oui, c'est fait pour ceux qui n'ont jamais fait visiter."
        },
        {
          question: "Faut-il des compétences particulières ?",
          answer: "Non, juste du bon sens et l'envie d'apprendre."
        }
      ]
    },
    cta: {
      label: "Obtenir la formation – 29€",
      subtext: "Paiement sécurisé - Accès immédiat"
    },
    benefits: [
      "Mieux organiser vos visites",
      "Poser les bonnes questions",
      "Éviter le stress des débutants",
      "Conseils simples et pratiques"
    ]
  },

  PACK89: {
    sku: "PACK89",
    slug: "pack-debutant",
    title: "Pack débutant complet", 
    subtitle: "Les 3 formations de base",
    priceEuros: 89,
    hero: {
      h1: "Pack complet pour débuter la vente immobilière",
      hook: "Les 3 formations essentielles pour vendre votre bien vous-même sans vous ruiner en frais d'agence.",
      bulletPoints: [
        "✅ Les 3 formations de base (valeur 113€) pour 89€",
        "✅ Économisez 24€ par rapport à l'achat séparé",
        "✅ Tout ce qu'il faut pour débuter", 
        "✅ Formations courtes et pratiques"
      ]
    },
    sections: {
      learn: {
        title: "Vos 3 formations de base",
        items: [
          "🏠 ESTIMATION : Les bases pour évaluer votre bien (47€)",
          "📝 ANNONCE : Rédiger une annonce qui attire (37€)", 
          "👥 VISITES : Organiser et recevoir les visiteurs (29€)"
        ]
      },
      deliverables: {
        title: "Ce que vous recevez",
        items: [
          "🎥 3h15 de vidéos au total",
          "📋 Toutes les check-lists pratiques",
          "📝 Modèles et exemples concrets",
          "💡 Conseils de base pour débutants"
        ]
      },
      guarantee: "Satisfait ou remboursé sous 7 jours.",
      faq: [
        {
          question: "C'est vraiment pour les débutants ?",
          answer: "Oui, parfait si vous n'avez jamais vendu de bien immobilier."
        },
        {
          question: "Peut-on acheter les formations séparément ?",
          answer: "Oui, mais le pack vous fait économiser 24€."
        }
      ]
    },
    cta: {
      label: "Obtenir le pack – 89€",
      subtext: "Économisez 24€ - Formations débutants"
    },
    benefits: [
      "Économisez sur les frais d'agence",
      "Formations courtes et pratiques",
      "Tout pour débuter sereinement",
      "Prix accessible"
    ]
  }
};

// Configuration pour le catalogue
export const catalogConfig = {
  comingSoon: false, // Set to true to enable coming soon mode
  prelaunchTitle: "Formations Premium - Arrivée très prochainement",
  prelaunchSubtitle: "Devenez votre propre agent immobilier et économisez des milliers d'euros",
  prelaunchCta: "Être prévenu du lancement",
  prelaunchBenefits: [
    "Méthodes professionnelles d'estimation immobilière",
    "Stratégies digitales pour promouvoir votre bien",
    "Scripts de qualification des acheteurs potentiels",
    "Techniques avancées de négociation",
    "Accompagnement personnalisé pendant 3 mois"
  ]
};

// Featured course for homepage and catalog
export const featuredCourse = "PACK89";

// Course order for display
export const courseOrder = ["ESTIMER47", "ANNONCE37", "VISITES29", "PACK89"];