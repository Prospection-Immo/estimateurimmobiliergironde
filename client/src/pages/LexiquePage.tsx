import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LexiquePageProps {
  domain?: string;
}

export default function LexiquePage({ domain = "estimation-immobilier-gironde.fr" }: LexiquePageProps) {
  const lexiqueItems = [
    {
      letter: "A",
      terms: [
        {
          term: "Acte authentique",
          definition: "Document officiel signé devant notaire qui finalise la vente. À partir de ce moment, l'acheteur devient propriétaire."
        },
        {
          term: "Acte de vente", 
          definition: "Autre nom de l'acte authentique, c'est le contrat définitif qui transfère la propriété."
        }
      ]
    },
    {
      letter: "B",
      terms: [
        {
          term: "Bornage",
          definition: "Opération menée par un géomètre pour fixer officiellement les limites d'un terrain. Utile en Gironde où de nombreux terrains sont boisés ou viticoles."
        },
        {
          term: "Bon de visite",
          definition: "Document que signe un acheteur après avoir visité un bien avec une agence."
        }
      ]
    },
    {
      letter: "C",
      terms: [
        {
          term: "Compromis de vente",
          definition: "Avant-contrat signé entre vendeur et acheteur. Il engage les deux parties sous conditions (souvent l'obtention du prêt de l'acheteur)."
        },
        {
          term: "Conditions suspensives",
          definition: "Éléments qui doivent se réaliser pour valider la vente (ex : obtention d'un crédit immobilier)."
        },
        {
          term: "Commission d'agence",
          definition: "Rémunération d'une agence immobilière. Elle est souvent fixée entre 3% et 6% du prix de vente en Gironde."
        }
      ]
    },
    {
      letter: "D",
      terms: [
        {
          term: "Diagnostics immobiliers",
          definition: "Documents obligatoires lors d'une vente (DPE, amiante, gaz, électricité, plomb, etc.)."
        },
        {
          term: "DPE – Diagnostic de Performance Énergétique",
          definition: "Évalue la consommation énergétique du logement. En Gironde, un DPE favorable augmente fortement l'attractivité d'un bien."
        }
      ]
    },
    {
      letter: "F",
      terms: [
        {
          term: "Frais de notaire",
          definition: "Taxes et honoraires dus lors de la vente. Dans l'ancien, ils sont payés par l'acheteur (≈ 7 à 8 % du prix)."
        },
        {
          term: "Financement",
          definition: "Moyens utilisés par l'acheteur (apport + crédit immobilier)."
        }
      ]
    },
    {
      letter: "G",
      terms: [
        {
          term: "Garantie décennale",
          definition: "Assurance couvrant les travaux récents contre les défauts graves pendant 10 ans."
        },
        {
          term: "Gage hypothécaire",
          definition: "Garantie prise par une banque sur un bien immobilier pour sécuriser son prêt."
        }
      ]
    },
    {
      letter: "M",
      terms: [
        {
          term: "Mandat de vente",
          definition: "Contrat qui autorise une agence à vendre un bien. Simple : plusieurs agences possibles. Exclusif : une seule agence a le droit de vendre."
        }
      ]
    },
    {
      letter: "N",
      terms: [
        {
          term: "Notaire",
          definition: "Professionnel indispensable pour officialiser la vente. En Gironde, les notaires de Bordeaux ou Arcachon connaissent bien les particularités locales (terrains viticoles, zones littorales, etc.)."
        }
      ]
    },
    {
      letter: "O",
      terms: [
        {
          term: "Offre d'achat",
          definition: "Proposition écrite d'un acheteur avec prix et conditions."
        },
        {
          term: "Offre de prêt",
          definition: "Document officiel envoyé par la banque à l'acheteur, fixant les conditions de financement."
        }
      ]
    },
    {
      letter: "P",
      terms: [
        {
          term: "Promesse de vente",
          definition: "Avant-contrat par lequel le vendeur s'engage à céder son bien à un prix fixé, souvent utilisé en alternative au compromis."
        },
        {
          term: "Plus-value immobilière",
          definition: "Gain réalisé si le prix de vente est supérieur au prix d'achat. En Gironde, les résidences secondaires (Arcachon, bassin) sont souvent concernées."
        }
      ]
    },
    {
      letter: "R",
      terms: [
        {
          term: "Rétractation",
          definition: "Délai légal de 10 jours dont dispose l'acheteur après la signature du compromis pour annuler son achat sans pénalité."
        }
      ]
    },
    {
      letter: "S",
      terms: [
        {
          term: "Surface Carrez",
          definition: "Surface habitable calculée selon la loi Carrez (ne concerne pas les maisons individuelles, uniquement les lots en copropriété)."
        },
        {
          term: "Succession",
          definition: "Transmission d'un bien après un décès. Peut impliquer plusieurs héritiers et ralentir la vente."
        }
      ]
    },
    {
      letter: "T",
      terms: [
        {
          term: "Taxe foncière",
          definition: "Impôt payé chaque année par le propriétaire. En Gironde, elle varie fortement selon les communes."
        },
        {
          term: "Titre de propriété",
          definition: "Document prouvant que vous êtes propriétaire du bien. Indispensable pour vendre."
        }
      ]
    },
    {
      letter: "V",
      terms: [
        {
          term: "Valeur vénale",
          definition: "Prix auquel un bien pourrait être vendu dans des conditions normales de marché. C'est la base d'une estimation immobilière sérieuse."
        },
        {
          term: "Visite virtuelle",
          definition: "Outil digital permettant à un acheteur de visiter un logement à distance. Très utilisé aujourd'hui en Gironde pour séduire des acquéreurs parisiens ou étrangers."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" data-testid="link-back-home">
              <Button variant="ghost" className="mb-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Lexique Immobilier du Propriétaire Vendeur en Gironde</h1>
              </div>
              
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Vous envisagez de vendre votre maison ou appartement en Gironde ?
                Le vocabulaire immobilier peut parfois sembler technique et décourageant : compromis, acte authentique, diagnostics, frais de notaire…
              </p>
              
              <div className="bg-primary/10 p-4 rounded-lg max-w-2xl mx-auto">
                <p className="text-primary font-medium">
                  👉 Ce lexique clair et complet vous aide à comprendre tous les termes essentiels avant de signer.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Chaque définition est adaptée aux propriétaires vendeurs et reliée aux spécificités du marché en Gironde (Bordeaux, Arcachon, Libourne, etc.).
                </p>
              </div>
            </div>
          </div>

          {/* Sommaire */}
          <Card className="p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Sommaire rapide A–Z</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {lexiqueItems.map((section) => (
                <a 
                  key={section.letter}
                  href={`#letter-${section.letter}`}
                  className="px-3 py-1 rounded hover-elevate text-primary font-medium"
                  data-testid={`link-letter-${section.letter}`}
                >
                  {section.letter}
                </a>
              ))}
            </div>
          </Card>

          {/* Lexique Content */}
          <div className="space-y-8">
            {lexiqueItems.map((section) => (
              <Card key={section.letter} className="p-6" id={`letter-${section.letter}`}>
                <div className="flex items-center space-x-3 mb-6">
                  <Badge variant="outline" className="text-xl font-bold w-12 h-12 flex items-center justify-center">
                    {section.letter}
                  </Badge>
                  <h2 className="text-2xl font-bold">{section.letter}</h2>
                </div>
                
                <div className="space-y-6">
                  {section.terms.map((item, index) => (
                    <div key={index} className="border-l-4 border-primary/20 pl-4">
                      <h3 className="text-lg font-semibold mb-2 text-primary" data-testid={`term-${item.term.replace(/\s+/g, '-').toLowerCase()}`}>
                        {item.term}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Conclusion */}
          <Card className="p-8 mt-12 bg-primary/5 border-primary/20">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-primary">Conclusion & Conseil pratique</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Comprendre le vocabulaire immobilier vous permet de vendre en confiance et de mieux négocier.
                En Gironde, où le marché est dynamique et varié (Bordeaux métropole, littoral, campagne), 
                il est crucial de maîtriser ces notions pour éviter les mauvaises surprises.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link href="/estimation" data-testid="link-estimation-cta">
                  <Button className="w-full sm:w-auto" data-testid="button-estimation-cta">
                    Estimation gratuite
                  </Button>
                </Link>
                <Link href="/contact" data-testid="link-contact-cta">
                  <Button variant="outline" className="w-full sm:w-auto" data-testid="button-contact-cta">
                    Nous contacter
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
      
      <Footer domain={domain} />
    </div>
  );
}