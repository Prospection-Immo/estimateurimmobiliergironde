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
  ESTIMER97: {
    sku: "ESTIMER97",
    slug: "estimer-bien",
    title: "Estimer son bien comme un pro",
    subtitle: "Méthode simple, fiable, reproductible",
    priceEuros: 97,
    hero: {
      h1: "Découvrez la méthode des pros pour estimer votre bien à ±3% près",
      hook: "En 2024, 67% des propriétaires vendent sous le prix de marché par manque de méthode fiable. Cette formation vous évite cette erreur coûteuse.",
      proof: "Méthode utilisée par + de 1200 propriétaires en Gironde",
      bulletPoints: [
        "✅ Estimation précise à ±3% près en moins de 30 minutes",
        "✅ Méthode validée par des experts immobiliers",
        "✅ Évitez de perdre 15 000€ à 45 000€ sur votre vente",
        "✅ Négociez en position de force face aux acquéreurs"
      ]
    },
    sections: {
      learn: {
        title: "Ce que vous allez apprendre",
        items: [
          "La méthode des 3 comparables : comment identifier les biens de référence pertinents",
          "Les 7 critères décisifs qui impactent vraiment le prix (surface, étage, exposition, etc.)",
          "Comment ajuster le prix selon l'état général et les travaux à prévoir",
          "L'analyse du marché local : saisonnalité, tendances, délais de vente moyens",
          "Les pièges à éviter : surestimation, sous-estimation, biais psychologiques",
          "Comment utiliser les outils gratuits (DVF, sites spécialisés, notaires)"
        ]
      },
      deliverables: {
        title: "Ce que vous recevez",
        items: [
          "📋 Tableur d'estimation automatisé (modèle Excel/Google Sheets)",
          "🎥 3h de vidéos explicatives avec exemples concrets en Gironde",
          "📊 Grille de comparaison des biens de référence",
          "📋 Check-list des 15 points à vérifier avant estimation",
          "🔍 Guide des sources de données fiables (DVF, notaires, sites)",
          "💡 Cas pratiques : 5 estimations détaillées étape par étape"
        ]
      },
      guarantee: "Garantie 14 jours : Si votre estimation diffère de + de 5% du prix de vente final (hors négociation), formation intégralement remboursée.",
      faq: [
        {
          question: "Cette méthode fonctionne-t-elle partout en France ?",
          answer: "Oui, mais la formation se concentre sur la Gironde avec des exemples locaux. Les principes sont universels et adaptables partout."
        },
        {
          question: "Faut-il des compétences techniques ?",
          answer: "Non, la méthode est accessible à tous. Si vous savez utiliser une calculatrice et internet, c'est suffisant."
        },
        {
          question: "Combien de temps pour maîtriser la méthode ?",
          answer: "2-3 heures pour comprendre, puis 30 minutes par estimation. Avec la pratique, vous serez autonome rapidement."
        }
      ]
    },
    cta: {
      label: "Obtenir la formation – 97€",
      subtext: "Paiement sécurisé - Accès immédiat - Garantie 14 jours"
    },
    benefits: [
      "Évitez de vendre 20 000€ sous le prix",
      "Négociez avec confiance",
      "Gagnez du temps et de l'argent",
      "Méthode validée par des experts"
    ]
  },

  FACE147: {
    sku: "FACE147",
    slug: "facebook-immobilier", 
    title: "Promouvoir son bien avec Facebook",
    subtitle: "Publier, booster, capter des contacts qualifiés",
    priceEuros: 147,
    hero: {
      h1: "Vendez + vite grâce à Facebook : 3x plus de contacts qualifiés",
      hook: "Pendant que vos concurrents attendent sur Le Bon Coin, vous captez les acheteurs motivés directement sur Facebook où ils passent 2h par jour.",
      proof: "Méthode testée : 89% des biens vendus en - de 45 jours",
      bulletPoints: [
        "✅ 3x plus de contacts qualifiés qu'avec les sites classiques",  
        "✅ Ciblage précis : revenus, âge, situation familiale, secteur",
        "✅ Coût : 50€ à 150€ de publicité = économie de 5000€ sur commission",
        "✅ Vendez avant même la mise sur le marché traditionnelle"
      ]
    },
    sections: {
      learn: {
        title: "Ce que vous allez maîtriser",
        items: [
          "Créer des visuels vendeurs avec votre smartphone (sans photographe)",
          "Rédiger des annonces qui convertissent (titre, description, call-to-action)",
          "Paramétrer le ciblage Facebook pour toucher VOS acheteurs potentiels",
          "Définir le budget publicitaire optimal selon votre bien (50€ à 200€)",
          "Analyser les statistiques pour optimiser vos campagnes en temps réel",
          "Gérer les conversations et qualifier les prospects rapidement"
        ]
      },
      deliverables: {
        title: "Vos outils clés en main",
        items: [
          "🎥 4h de vidéos pas-à-pas (création compte à vente finale)",
          "📱 Templates d'annonces qui convertissent (5 modèles testés)",
          "🎯 Scripts de paramétrage du ciblage (âge, revenus, localisation)",
          "📊 Tableur de suivi des performances (ROI, coût par contact)",
          "💬 Scripts de conversation pour qualifier les prospects",
          "🔥 Bonus : 20 exemples d'annonces qui ont vendu en - de 30 jours"
        ]
      },
      guarantee: "Garantie résultat : Si vous n'obtenez pas au moins 10 contacts qualifiés en 30 jours, formation remboursée à 100%.",
      faq: [
        {
          question: "Quel budget publicitaire prévoir ?",
          answer: "Entre 50€ et 200€ selon votre bien. Un appartement à 300k€ nécessite ~100€ de pub pour toucher 2000 personnes ciblées."
        },
        {
          question: "Est-ce légal de vendre sans agent ?",
          answer: "Parfaitement légal ! C'est de la vente entre particuliers. Nous couvrons aussi les aspects juridiques dans la formation."
        },
        {
          question: "Facebook ne va-t-il pas bloquer mes annonces ?",
          answer: "Non si vous respectez les bonnes pratiques enseignées. Nous vous montrons comment éviter les erreurs qui font rejeter les annonces."
        }
      ]
    },
    cta: {
      label: "Obtenir la formation – 147€", 
      subtext: "Paiement sécurisé - Accès immédiat - Garantie résultat 30 jours"
    },
    benefits: [
      "Vendez en moyenne 30% plus rapidement",
      "Économisez les frais d'agence (3000€ à 15000€)",
      "Contrôlez entièrement votre vente",
      "Captez des acheteurs motivés et solvables"
    ]
  },

  QUALI97: {
    sku: "QUALI97", 
    slug: "qualifier-acheteurs",
    title: "Qualifier ses acheteurs",
    subtitle: "Scripts et signaux pour filtrer efficacement",
    priceEuros: 97,
    hero: {
      h1: "Ne perdez plus votre temps avec des visiteurs non qualifiés",
      hook: "78% des visites sont du temps perdu avec des curieux non solvables. Ces scripts vous permettent d'identifier les vrais acheteurs dès le premier contact.",
      proof: "Méthode BANT utilisée par les pros : Budget, Authority, Need, Timeline",
      bulletPoints: [
        "✅ Identifiez les acheteurs sérieux dès le premier échange",
        "✅ Évitez 80% des visites inutiles (curieux, non solvables, chasseurs de bonnes affaires)",
        "✅ Négociez uniquement avec des prospects qualifiés et motivés", 
        "✅ Réduisez votre temps de vente de 60% en ciblant les bons profils"
      ]
    },
    sections: {
      learn: {
        title: "Vos nouveaux super-pouvoirs",
        items: [
          "La méthode BANT adaptée à l'immobilier : Budget, Autorité, Besoin, Timing",
          "Les 12 questions qui révèlent la motivation réelle d'un acheteur",
          "Comment détecter les signaux d'achat fort (verbal et non-verbal)", 
          "Scripts téléphoniques pour qualifier en 5 minutes maximum",
          "Gérer les objections courantes et relancer les indécis",
          "Créer l'urgence positive pour accélérer la décision d'achat"
        ]
      },
      deliverables: {
        title: "Votre arsenal de qualification",
        items: [
          "📞 Scripts téléphoniques clés en main (premier contact, relance, objections)",
          "🎥 2h30 de mise en situation avec vrais prospects",
          "📋 Grille de scoring BANT pour noter chaque prospect sur 100",
          "💬 Guide des 50 objections les + courantes et leurs réponses",
          "⏱️ Chronologie optimale : quand relancer, quand abandonner",
          "🎯 Templates d'emails de suivi personnalisés selon le profil"
        ]
      },
      guarantee: "Garantie efficacité : Si vous ne réduisez pas de 50% vos visites inutiles, formation remboursée.",
      faq: [
        {
          question: "Ne vais-je pas paraître trop insistant ?",
          answer: "Au contraire ! Les vrais acheteurs apprécient votre professionnalisme. Les autres se désintéressent naturellement."
        },
        {
          question: "Que faire si l'acheteur refuse de répondre ?",
          answer: "C'est déjà un signal ! Nous vous enseignons comment gérer ces situations et quand insister ou abandonner."
        },
        {
          question: "Cette méthode fonctionne-t-elle aussi par email/SMS ?",
          answer: "Oui, nous adaptons la méthode BANT à tous les canaux de communication : téléphone, email, SMS, même en face à face."
        }
      ]
    },
    cta: {
      label: "Obtenir la formation – 97€",
      subtext: "Paiement sécurisé - Accès immédiat - Garantie efficacité"  
    },
    benefits: [
      "Divisez par 2 votre temps de vente",
      "Négociez avec des acheteurs motivés",
      "Évitez le stress des visites inutiles",
      "Vendez au meilleur prix rapidement"
    ]
  },

  PO147: {
    sku: "PO147",
    slug: "porte-ouverte-optimisee", 
    title: "Porte ouverte unique & optimisée",
    subtitle: "Organisation, calendrier, mise en scène, effet d'urgence",
    priceEuros: 147,
    hero: {
      h1: "Transformez votre porte ouverte en machine à vendre",
      hook: "Une seule porte ouverte bien orchestrée peut générer 3 à 5 offres d'achat. La méthode que les agents immobiliers ne veulent pas que vous connaissiez.",
      proof: "Résultat moyen : 4,2 offres par porte ouverte organisée",
      bulletPoints: [
        "✅ Créez une compétition entre acheteurs le jour J",
        "✅ Récoltez plusieurs offres d'achat en simultané", 
        "✅ Vendez au prix fort grâce à l'effet d'urgence maîtrisé",
        "✅ Organisation clés en main : de l'invitation à la signature"
      ]
    },
    sections: {
      learn: {
        title: "Votre protocole de vente express",
        items: [
          "Home staging express : valoriser votre bien en 48h (sans gros budget)",
          "Créer l'événement : invitations, communication, effet de rareté",
          "Orchestrer la journée : planning, accueil, parcours de visite optimisé",
          "Psychologie des groupes : comment créer l'émulation entre visiteurs",
          "Techniques de closing : récolter les offres le jour même",
          "Gérer les négociations multiples pour maximiser le prix final"
        ]
      },
      deliverables: {
        title: "Votre kit de porte ouverte professionnelle",
        items: [
          "🏠 Check-list home staging express (24 points en 48h)",
          "🎥 3h de vidéos : de la préparation à la signature",
          "📧 Templates d'invitation par email/SMS (5 versions testées)",
          "⏰ Planning minute par minute de votre journée porte ouverte",
          "💰 Scripts de négociation pour gérer les offres multiples",
          "🔥 Bonus : Kit signalétique professionnel à imprimer"
        ]
      },
      guarantee: "Garantie offre : Si vous n'obtenez aucune offre d'achat ferme lors de votre porte ouverte organisée selon nos conseils, formation remboursée à 100%.",
      faq: [
        {
          question: "Combien d'invités faut-il pour créer l'émulation ?",
          answer: "Minimum 15 visiteurs programmés (pour 8-10 présents). Nous vous montrons comment atteindre ce nombre via différents canaux."
        },
        {
          question: "Que faire si plusieurs personnes font la même offre ?",
          answer: "C'est le jackpot ! Nous vous enseignons la technique de la 'surenchère organisée' pour faire monter naturellement les prix."
        },
        {
          question: "Est-ce que ça marche aussi pour les maisons ?",
          answer: "Parfaitement ! Même principe, mais avec des adaptations spécifiques (jardin, stationnement, etc.) que nous détaillons."
        }
      ]
    },
    cta: {
      label: "Obtenir la formation – 147€",
      subtext: "Paiement sécurisé - Accès immédiat - Garantie offre ferme"
    },
    benefits: [
      "Vendez en une seule journée",
      "Obtenez le meilleur prix grâce à la compétition",
      "Évitez des mois de visites individuelles",
      "Créez un événement mémorable et professionnel"
    ]
  },

  PACK397: {
    sku: "PACK397",
    slug: "pack-complet",
    title: "Pack complet \"Devenir son propre agent\"", 
    subtitle: "Les 4 formations + modèles prêts à l'emploi",
    priceEuros: 397,
    hero: {
      h1: "Devenez votre propre agent immobilier et économisez 5000€ à 15000€",
      hook: "Le pack complet pour vendre comme un pro : estimation précise + promotion Facebook + qualification + porte ouverte. Tout ce qu'il faut pour réussir votre vente de A à Z.",
      proof: "Économie moyenne : 8500€ de frais d'agence + vente 25% plus rapide",
      bulletPoints: [
        "✅ Les 4 formations complètes (valeur 488€) pour seulement 397€",
        "✅ Économisez 91€ par rapport à l'achat séparé",
        "✅ Maîtrisez toute la chaîne de vente immobilière", 
        "✅ Bonus exclusif : suivi personnalisé pendant 3 mois"
      ]
    },
    sections: {
      learn: {
        title: "Votre formation complète d'agent immobilier",
        items: [
          "🎯 ESTIMATION : Méthode des pros à ±3% près (97€)",
          "📱 FACEBOOK : Promotion digitale et captation de prospects (147€)", 
          "🔍 QUALIFICATION : Scripts BANT pour filtrer les acheteurs (97€)",
          "🏠 PORTE OUVERTE : Technique de vente groupée express (147€)",
          "💼 BONUS : Négociation immobilière avancée",
          "📋 BONUS : Aspects juridiques de la vente entre particuliers"
        ]
      },
      deliverables: {
        title: "Votre arsenal complet de pro",
        items: [
          "🎥 12h de formation vidéo (valeur totale 488€)",
          "📊 Tous les tableurs et outils d'estimation/suivi",
          "📞 Scripts complets : téléphone, email, négociation",
          "🎯 Templates Facebook et modèles d'annonces",
          "📋 Check-lists pour chaque étape de vente",
          "🔥 BONUS EXCLUSIF : 3 mois d'accompagnement email personnalisé",
          "⭐ BONUS COURTIER : Contacts privilégiés pour le financement acheteur"
        ]
      },
      guarantee: "Garantie totale : Si vous ne vendez pas dans les 6 mois en appliquant nos méthodes OU si vous n'économisez pas au moins 3000€ en frais d'agence, pack intégralement remboursé.",
      faq: [
        {
          question: "Quelle économie réelle puis-je espérer ?",
          answer: "Entre 5000€ et 15000€ de frais d'agence + vente souvent 20-30% plus rapide. Le pack est rentabilisé dès la première vente."
        },
        {
          question: "L'accompagnement personnalisé, comment ça marche ?",
          answer: "Pendant 3 mois, vous pouvez m'envoyer vos questions par email (estimation, négociation, blocages...). Je réponds sous 48h."
        },
        {
          question: "Si j'ai déjà acheté une formation, puis-je avoir le pack ?",
          answer: "Oui ! Contactez-nous avec votre facture, nous déduisons ce que vous avez déjà payé du prix du pack."
        }
      ]
    },
    cta: {
      label: "Obtenir le pack complet – 397€",
      subtext: "Économisez 91€ + Bonus exclusifs + Accompagnement 3 mois"
    },
    benefits: [
      "Économisez 5000€ à 15000€ de frais d'agence",
      "Vendez 25% plus rapidement qu'avec un agent",
      "Maîtrisez chaque étape de A à Z",
      "Accompagnement personnalisé inclus"
    ],
    testimonial: {
      name: "Marie C., Bordeaux",
      text: "Grâce au pack, j'ai vendu mon T4 en 3 semaines avec 4 offres d'achat. J'ai économisé 7200€ de frais d'agence !",
      result: "Vendu en 21 jours - 7200€ économisés"
    }
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
    "Stratégies de vente digitale avec Facebook", 
    "Scripts de qualification et négociation",
    "Techniques de porte ouverte optimisée",
    "Économisez 5000€ à 15000€ de frais d'agence"
  ]
};

// Upsell configuration
export const upsellConfig = {
  sku: "UPSELLPACK300",
  title: "Offre Flash : Pack Complet à -25%",
  subtitle: "Cette offre expire dans 20 minutes",
  originalPrice: 397,
  discountPrice: 300,
  savings: 97,
  hook: "Vous avez fait le premier pas, ne vous arrêtez pas là ! Complétez votre formation avec le pack complet à prix exceptionnel.",
  benefits: [
    "Les 3 autres formations immédiatement (valeur 291€)", 
    "Bonus exclusif : accompagnement 3 mois",
    "Contacts privilégiés courtier",
    "Support prioritaire"
  ],
  urgency: "⏰ Cette offre n'est disponible que dans les 20 minutes suivant votre premier achat.",
  cta: "Oui, je veux le pack à 300€ (au lieu de 397€)"
};