import { useState, useEffect } from "react";
import { Switch, Route, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import PropertyEstimationForm from "@/components/PropertyEstimationForm";
import EstimationResults from "@/components/EstimationResults";
import ContactForm from "@/components/ContactForm";
import AdminDashboard from "@/components/AdminDashboard";

// Utility function to detect domain from Host header
function getDomainFromHeaders(): string {
  // TODO: In production, read from Host header via server-side props
  // For now, return default domain for prototype
  return "estimation-immobilier-gironde.fr";
}

// Home Page Component
function HomePage() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <Hero domain={domain} />
        
        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Pourquoi choisir notre service ?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Notre expertise locale et notre méthodologie rigoureuse garantissent 
                des estimations fiables et précises.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="text-xl font-semibold">Expertise locale</h3>
                <p className="text-muted-foreground">
                  Connaissance approfondie du marché immobilier bordelais et girondin
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold">Données fiables</h3>
                <p className="text-muted-foreground">
                  Analyse basée sur les transactions récentes et les tendances du marché
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold">Résultat instantané</h3>
                <p className="text-muted-foreground">
                  Estimation gratuite et immédiate, rapport détaillé en quelques minutes
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Estimation Page
function EstimationPage() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <PropertyEstimationForm />
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Results Page
function ResultsPage() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <EstimationResults />
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Contact Page
function ContactPage() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <ContactForm />
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Prix m² Page
function PrixM2Page() {
  const domain = getDomainFromHeaders();
  const [priceData, setPriceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const response = await fetch('/api/prix-m2');
        if (response.ok) {
          const data = await response.json();
          setPriceData(data);
        }
      } catch (error) {
        console.error('Error fetching price data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Prix au m² en Gironde</h1>
            <p className="text-muted-foreground">
              Découvrez les prix immobiliers actuels dans les principales villes de la Gironde. 
              Données mises à jour régulièrement selon les transactions récentes.
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p>Chargement des données...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {priceData.map((city: any) => (
                <div key={city.city} className="bg-card p-6 rounded-lg border border-card-border hover-elevate">
                  <h3 className="font-semibold text-lg mb-2">{city.city}</h3>
                  <p className="text-2xl font-bold text-primary mb-1">
                    {city.priceM2.toLocaleString()} €/m²
                  </p>
                  <p className={`text-sm ${city.trend === 'up' ? 'text-chart-2' : 'text-muted-foreground'}`}>
                    {city.change} vs année dernière
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Admin Login Page (Simple)
function AdminLoginPage() {
  const domain = getDomainFromHeaders();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          // Already logged in, redirect to admin dashboard
          window.location.href = '/admin';
          return;
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setCheckingAuth(false);
    }
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        window.location.href = '/admin';
      } else {
        const errorData = await response.text();
        setError("Nom d'utilisateur ou mot de passe incorrect");
      }
    } catch (error) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background">
        <Header domain={domain} />
        <main className="py-16">
          <div className="max-w-md mx-auto px-4 text-center">
            <p>Vérification de l'authentification...</p>
          </div>
        </main>
        <Footer domain={domain} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main className="py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-card p-8 rounded-lg border border-card-border">
            <h1 className="text-2xl font-bold mb-6 text-center">Connexion Admin</h1>
            <form className="space-y-4" onSubmit={handleLogin}>
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Nom d'utilisateur</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 border border-border rounded-md bg-background"
                  data-testid="input-admin-username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-border rounded-md bg-background"
                  data-testid="input-admin-password"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground p-3 rounded-md hover-elevate disabled:opacity-50"
                data-testid="button-admin-login"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Admin Dashboard Page
function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard />
    </div>
  );
}

// Guides Page
function GuidesPage() {
  const domain = getDomainFromHeaders();
  
  const guides = [
    {
      slug: "acheter-premiere-fois",
      title: "Guide complet : Acheter pour la première fois",
      excerpt: "Tous les conseils pour réussir votre premier achat immobilier en Gironde",
      category: "Achat",
      readTime: "8 min"
    },
    {
      slug: "vendre-rapidement",
      title: "Comment vendre son bien rapidement",
      excerpt: "Les meilleures stratégies pour vendre votre propriété au meilleur prix",
      category: "Vente",
      readTime: "6 min"
    },
    {
      slug: "investissement-locatif",
      title: "Investissement locatif : le guide complet",
      excerpt: "Tout savoir sur l'investissement immobilier locatif en Gironde",
      category: "Investissement",
      readTime: "12 min"
    },
    {
      slug: "estimation-juste-prix",
      title: "Comment estimer le juste prix de votre bien",
      excerpt: "Méthodologie et critères pour une estimation immobilière précise",
      category: "Estimation",
      readTime: "5 min"
    }
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Guides Immobiliers</h1>
            <p className="text-xl text-muted-foreground">
              Découvrez nos guides pratiques pour vous accompagner dans vos projets immobiliers
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide) => (
              <div key={guide.slug} className="bg-card p-6 rounded-lg border border-card-border hover-elevate">
                <div className="mb-4">
                  <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
                    {guide.category}
                  </span>
                  <span className="float-right text-sm text-muted-foreground">
                    {guide.readTime}
                  </span>
                </div>
                <h2 className="text-xl font-semibold mb-3">{guide.title}</h2>
                <p className="text-muted-foreground mb-4">{guide.excerpt}</p>
                <a
                  href={`/guides/${guide.slug}`}
                  className="inline-flex items-center text-primary hover:underline font-medium"
                  data-testid={`link-guide-${guide.slug}`}
                >
                  Lire le guide →
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Guide Detail Page
function GuideDetailPage() {
  const domain = getDomainFromHeaders();
  const [match] = useRoute("/guides/:slug");
  const slug = match?.slug;
  
  // Guide content data
  const guidesData: Record<string, {
    title: string;
    category: string;
    readTime: string;
    content: Array<{
      type: 'paragraph' | 'heading' | 'list';
      content: string | string[];
    }>;
  }> = {
    "acheter-premiere-fois": {
      title: "Guide complet : Acheter pour la première fois",
      category: "Achat",
      readTime: "8 min",
      content: [
        {
          type: 'paragraph',
          content: "Acheter son premier logement est une étape importante de la vie. Ce guide vous accompagne pas à pas dans cette démarche pour que votre projet se déroule dans les meilleures conditions."
        },
        {
          type: 'heading',
          content: "1. Définir votre budget"
        },
        {
          type: 'paragraph',
          content: "La première étape consiste à déterminer votre capacité d'emprunt. En règle générale, vos mensualités ne doivent pas dépasser 33% de vos revenus nets."
        },
        {
          type: 'heading',
          content: "2. Choisir le bon secteur"
        },
        {
          type: 'paragraph',
          content: "En Gironde, plusieurs secteurs offrent un excellent rapport qualité-prix. Bordeaux centre reste prisé mais d'autres communes comme Mérignac ou Pessac proposent des alternatives intéressantes."
        },
        {
          type: 'heading',
          content: "3. Les étapes de l'achat"
        },
        {
          type: 'list',
          content: ["Recherche et visites", "Offre d'achat", "Compromis de vente", "Financement", "Acte authentique"]
        }
      ]
    },
    "vendre-rapidement": {
      title: "Comment vendre son bien rapidement",
      category: "Vente",
      readTime: "6 min",
      content: [
        {
          type: 'paragraph',
          content: "Vendre rapidement son bien immobilier nécessite une stratégie bien définie et une préparation minutieuse."
        },
        {
          type: 'heading',
          content: "1. Fixer le bon prix"
        },
        {
          type: 'paragraph',
          content: "Une estimation juste est cruciale. Un prix trop élevé décourage les acheteurs, un prix trop bas vous fait perdre de l'argent."
        },
        {
          type: 'heading',
          content: "2. Mettre en valeur votre bien"
        },
        {
          type: 'paragraph',
          content: "Home staging, nettoyage approfondi et petites réparations peuvent faire la différence."
        },
        {
          type: 'heading',
          content: "3. Optimiser la visibilité"
        },
        {
          type: 'list',
          content: ["Photos professionnelles", "Annonces sur plusieurs sites", "Visite virtuelle", "Plaquette commerciale"]
        }
      ]
    },
    "investissement-locatif": {
      title: "Investissement locatif : le guide complet",
      category: "Investissement",
      readTime: "12 min",
      content: [
        {
          type: 'paragraph',
          content: "L'investissement immobilier locatif en Gironde offre de belles opportunités de rendement et de constitution de patrimoine."
        },
        {
          type: 'heading',
          content: "1. Choisir le bon secteur"
        },
        {
          type: 'paragraph',
          content: "Proximité des transports, commerces, écoles et universités sont des critères essentiels pour attirer les locataires."
        },
        {
          type: 'heading',
          content: "2. Calculer la rentabilité"
        },
        {
          type: 'paragraph',
          content: "Rentabilité brute, charges, fiscalité : tous les éléments à prendre en compte pour évaluer la performance de votre investissement."
        },
        {
          type: 'heading',
          content: "3. Les dispositifs fiscaux"
        },
        {
          type: 'list',
          content: ["Loi Pinel", "LMNP", "Déficit foncier", "Réduction d'impôt"]
        }
      ]
    },
    "estimation-juste-prix": {
      title: "Comment estimer le juste prix de votre bien",
      category: "Estimation",
      readTime: "5 min",
      content: [
        {
          type: 'paragraph',
          content: "Une estimation précise est la clé d'une transaction immobilière réussie. Voici notre méthodologie."
        },
        {
          type: 'heading',
          content: "1. Analyse du marché local"
        },
        {
          type: 'paragraph',
          content: "Étude des ventes récentes dans votre secteur et des biens similaires au vôtre."
        },
        {
          type: 'heading',
          content: "2. Critères d'évaluation"
        },
        {
          type: 'list',
          content: ["Surface et nombre de pièces", "État général du bien", "Exposition et vue", "Prestations et équipements", "Environnement et transports"]
        },
        {
          type: 'heading',
          content: "3. Ajustements nécessaires"
        },
        {
          type: 'paragraph',
          content: "Prise en compte des spécificités de votre bien par rapport à la moyenne du marché."
        }
      ]
    }
  };

  const guide = slug ? guidesData[slug] : null;

  if (!guide) {
    return (
      <div className="min-h-screen bg-background">
        <Header domain={domain} />
        <main className="py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Guide non trouvé</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Le guide que vous recherchez n'existe pas ou a été déplacé.
            </p>
            <a 
              href="/guides"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md hover-elevate"
              data-testid="button-back-guides"
            >
              Retour aux guides
            </a>
          </div>
        </main>
        <Footer domain={domain} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <a href="/guides" className="text-primary hover:underline mb-4 inline-block">← Retour aux guides</a>
            <h1 className="text-4xl font-bold mb-4">{guide.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Catégorie: {guide.category}</span>
              <span>•</span>
              <span>Temps de lecture: {guide.readTime}</span>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none">
            {guide.content.map((section, index) => {
              if (section.type === 'paragraph') {
                return <p key={index}>{section.content}</p>;
              } else if (section.type === 'heading') {
                return <h2 key={index}>{section.content}</h2>;
              } else if (section.type === 'list') {
                return (
                  <ul key={index}>
                    {(section.content as string[]).map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return null;
            })}
            
            <div className="bg-primary/10 p-6 rounded-lg mt-8">
              <h3 className="text-lg font-semibold mb-3">Besoin d'une estimation ?</h3>
              <p className="mb-4">
                Estimez gratuitement votre future propriété avec notre outil en ligne.
              </p>
              <a
                href="/estimation"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover-elevate inline-block"
                data-testid="button-estimate-from-guide"
              >
                Faire une estimation
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Actualités Page
function ActualitesPage() {
  const domain = getDomainFromHeaders();
  
  const articles = [
    {
      slug: "marche-immobilier-gironde-2024",
      title: "Le marché immobilier en Gironde en 2024",
      excerpt: "Analyse des tendances et évolutions du marché immobilier girondin cette année",
      date: "15 décembre 2024",
      category: "Marché"
    },
    {
      slug: "nouveaux-quartiers-bordeaux",
      title: "Les nouveaux quartiers prometteurs de Bordeaux",
      excerpt: "Découvrez les zones en développement qui offrent de belles opportunités",
      date: "10 décembre 2024",
      category: "Urbanisme"
    },
    {
      slug: "taux-immobilier-baisse",
      title: "Taux immobiliers : une baisse attendue ?",
      excerpt: "Point sur l'évolution des taux de crédit immobilier et perspectives",
      date: "5 décembre 2024",
      category: "Financement"
    }
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Actualités Immobilières</h1>
            <p className="text-xl text-muted-foreground">
              Suivez les dernières actualités du marché immobilier en Gironde
            </p>
          </div>
          
          <div className="space-y-8">
            {articles.map((article) => (
              <div key={article.slug} className="bg-card p-6 rounded-lg border border-card-border hover-elevate">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
                      {article.category}
                    </span>
                    <span className="text-sm text-muted-foreground">{article.date}</span>
                  </div>
                </div>
                <h2 className="text-2xl font-semibold mb-3">{article.title}</h2>
                <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                <a
                  href={`/actualites/${article.slug}`}
                  className="inline-flex items-center text-primary hover:underline font-medium"
                  data-testid={`link-article-${article.slug}`}
                >
                  Lire l'article →
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Article Detail Page
function ArticleDetailPage() {
  const domain = getDomainFromHeaders();
  const [match] = useRoute("/actualites/:slug");
  const slug = match?.slug;
  
  // Articles content data
  const articlesData: Record<string, {
    title: string;
    category: string;
    date: string;
    content: Array<{
      type: 'paragraph' | 'heading' | 'list';
      content: string | string[];
    }>;
  }> = {
    "marche-immobilier-gironde-2024": {
      title: "Le marché immobilier en Gironde en 2024",
      category: "Marché",
      date: "15 décembre 2024",
      content: [
        {
          type: 'paragraph',
          content: "L'année 2024 marque un tournant pour le marché immobilier en Gironde. Après plusieurs années de forte croissance, le marché connaît une stabilisation bienvenue pour les acquéreurs."
        },
        {
          type: 'heading',
          content: "Une stabilisation des prix"
        },
        {
          type: 'paragraph',
          content: "Les prix au mètre carré observent une pause dans leur progression, particulièrement à Bordeaux où le prix moyen se stabilise autour de 4 200€/m²."
        },
        {
          type: 'heading',
          content: "Les secteurs porteurs"
        },
        {
          type: 'paragraph',
          content: "Mérignac et Pessac continuent d'attirer les investisseurs grâce à leur excellent rapport qualité-prix et leur proximité avec Bordeaux."
        },
        {
          type: 'heading',
          content: "Perspectives 2025"
        },
        {
          type: 'paragraph',
          content: "Les experts s'accordent sur une poursuite de cette stabilisation, avec des opportunités intéressantes pour les primo-accédants."
        }
      ]
    },
    "nouveaux-quartiers-bordeaux": {
      title: "Les nouveaux quartiers prometteurs de Bordeaux",
      category: "Urbanisme",
      date: "10 décembre 2024",
      content: [
        {
          type: 'paragraph',
          content: "Bordeaux se transforme avec de nouveaux quartiers qui redéfinissent le paysage urbain et offrent de nouvelles opportunités d'investissement."
        },
        {
          type: 'heading',
          content: "Bordeaux Euratlantique"
        },
        {
          type: 'paragraph',
          content: "Ce quartier d'affaires international continue de se développer avec de nouveaux programmes résidentiels haut de gamme."
        },
        {
          type: 'heading',
          content: "La Bastide"
        },
        {
          type: 'paragraph',
          content: "Rive droite, ce secteur bénéficie d'une forte dynamique avec l'arrivée du pont Simone Veil et de nouveaux équipements."
        },
        {
          type: 'heading',
          content: "Darwin et Caserne Niel"
        },
        {
          type: 'list',
          content: ["Reconversion d'espaces industriels", "Mixité urbaine innovante", "Proximité des transports", "Environnement écologique"]
        }
      ]
    },
    "taux-immobilier-baisse": {
      title: "Taux immobiliers : une baisse attendue ?",
      category: "Financement",
      date: "5 décembre 2024",
      content: [
        {
          type: 'paragraph',
          content: "Après une période de hausse significative, les taux de crédit immobilier montrent des signes de détente qui pourraient relancer le marché."
        },
        {
          type: 'heading',
          content: "État actuel des taux"
        },
        {
          type: 'paragraph',
          content: "Les taux moyens oscillent actuellement entre 3,5% et 4,2% selon la durée du prêt et le profil emprunteur."
        },
        {
          type: 'heading',
          content: "Facteurs d'évolution"
        },
        {
          type: 'list',
          content: ["Politique monétaire de la BCE", "Inflation en recul", "Concurrence bancaire", "Demande des emprunteurs"]
        },
        {
          type: 'heading',
          content: "Impact sur le marché"
        },
        {
          type: 'paragraph',
          content: "Une baisse même modeste des taux pourrait relancer l'activité immobilière et améliorer le pouvoir d'achat des acquéreurs."
        }
      ]
    }
  };

  const article = slug ? articlesData[slug] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header domain={domain} />
        <main className="py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Article non trouvé</h1>
            <p className="text-lg text-muted-foreground mb-8">
              L'article que vous recherchez n'existe pas ou a été déplacé.
            </p>
            <a 
              href="/actualites"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md hover-elevate"
              data-testid="button-back-articles"
            >
              Retour aux actualités
            </a>
          </div>
        </main>
        <Footer domain={domain} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <a href="/actualites" className="text-primary hover:underline mb-4 inline-block">← Retour aux actualités</a>
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Catégorie: {article.category}</span>
              <span>•</span>
              <span>{article.date}</span>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none">
            {article.content.map((section, index) => {
              if (section.type === 'paragraph') {
                return <p key={index}>{section.content}</p>;
              } else if (section.type === 'heading') {
                return <h2 key={index}>{section.content}</h2>;
              } else if (section.type === 'list') {
                return (
                  <ul key={index}>
                    {(section.content as string[]).map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return null;
            })}
            
            <div className="bg-primary/10 p-6 rounded-lg mt-8">
              <h3 className="text-lg font-semibold mb-3">Estimez votre bien</h3>
              <p className="mb-4">
                Profitez de cette période favorable pour estimer la valeur de votre bien.
              </p>
              <a
                href="/estimation"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover-elevate inline-block"
                data-testid="button-estimate-from-article"
              >
                Faire une estimation gratuite
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// NotFound Page
function NotFound() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Page non trouvée</h1>
          <p className="text-lg text-muted-foreground mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <a 
            href="/"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md hover-elevate"
            data-testid="button-back-home"
          >
            Retour à l'accueil
          </a>
        </div>
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Router Component
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/estimation" component={EstimationPage} />
      <Route path="/estimation-resultats" component={ResultsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/prix-m2" component={PrixM2Page} />
      <Route path="/guides" component={GuidesPage} />
      <Route path="/guides/:slug" component={GuideDetailPage} />
      <Route path="/actualites" component={ActualitesPage} />
      <Route path="/actualites/:slug" component={ArticleDetailPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      {/* Legacy routes for backward compatibility */}
      <Route path="/gironde-login" component={AdminLoginPage} />
      <Route path="/gironde-admin-dashboard" component={AdminDashboardPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Main App Component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}