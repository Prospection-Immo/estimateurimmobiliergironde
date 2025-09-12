import { useState, useEffect } from "react";
import { Switch, Route, useRoute, useParams, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Zap, MapPin, Search, Mail, Eye, EyeOff, Brain, Target, Rocket, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import SmsVerificationHome from "@/components/SmsVerificationHome";

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import PropertyEstimationForm from "@/components/PropertyEstimationForm";
import EstimationResults from "@/components/EstimationResults";
import ContactForm from "@/components/ContactForm";
import AdminDashboard from "@/components/AdminDashboard";
import HomepageEstimationForm from "@/components/HomepageEstimationForm";
import FinancementPage from "@/pages/FinancementPage";
import MentionsLegalesPage from "@/pages/MentionsLegalesPage";
import ConfidentialitePage from "@/pages/ConfidentialitePage";
import CookiesPage from "@/pages/CookiesPage";
import ActualitesPageComponent from "@/pages/ActualitesPage";
import ArticleDetailPageComponent from "@/pages/ArticleDetailPage";
import LexiquePageComponent from "@/pages/LexiquePage";
import GuidesPageComponent from "@/pages/GuidesPage";
import GuideDetailPageComponent from "@/pages/GuideDetailPage";
import GuideThanksPage from "@/pages/GuideThanksPage";
import GuideReadPage from "@/pages/GuideReadPage";
import Admin2FALogin from "@/components/Admin2FALogin";
import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";

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
        
        {/* Section Estimateur */}
        <section className="py-16 bg-muted/20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Estimez votre bien gratuitement</h2>
              <p className="text-muted-foreground">
                Remplissez ces informations simples pour obtenir une estimation précise de votre propriété
              </p>
            </div>
            <HomepageEstimationForm />
          </div>
        </section>
        
        {/* 3 Blocs Section */}
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Ce que vous ressentez */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 p-2 rounded-lg">
                    <Brain className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Ce que vous ressentez aujourd'hui</h3>
                </div>
                <ul className="space-y-2">
                  <li className="text-sm text-muted-foreground">• Vous ne savez pas si votre agent vous dit la vérité sur le prix</li>
                  <li className="text-sm text-muted-foreground">• Vous avez peur de vendre trop bas et de perdre de l'argent</li>
                  <li className="text-sm text-muted-foreground">• Vous voulez une solution gratuite, objective, sans arrière-pensée</li>
                </ul>
              </div>

              {/* Ce que vous méritez */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">La solution que vous méritez</h3>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Des résultats garantis basés sur les vraies ventes DVF de votre quartier</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Notre nouvelle analyse IA exclusive de 50+ critères prix</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Un rapport détaillé gratuit pour vous faire économiser et gagner en négociation</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Solution 100% gratuite, sans engagement, résultats garantis en 3 minutes</span>
                  </li>
                </ul>
              </div>

              {/* Comment ça fonctionne */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <Rocket className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Comment ça fonctionne (plan en 3 étapes)</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">1</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Décrivez votre bien</p>
                      <p className="text-xs text-muted-foreground">Type, surface, ville, état général (2 minutes)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">2</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Notre IA analyse</p>
                      <p className="text-xs text-muted-foreground">Croisement des données DVF + critères marché local</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">3</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Recevez votre estimation</p>
                      <p className="text-xs text-muted-foreground">Fourchette précise + rapport détaillé par email</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Promise Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Votre nouvelle solution d'estimation gratuite et fiable</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Découvrez notre estimateur révolutionnaire qui combine l'IA et les prix réels DVF pour vous offrir des résultats précis garantis. Cette solution exclusive vous permet d'économiser du temps et de gagner en confiance pour vos décisions immobilières stratégiques en Gironde.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold" data-testid="text-benefit-instantanee">Résultats instantanés gratuits</h3>
                <p className="text-muted-foreground text-sm">
                  Vous obtenez une estimation fiable basée sur les ventes réelles - garantie 100% gratuite
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold" data-testid="text-benefit-quartiers">Analyse exclusive des secteurs</h3>
                <p className="text-muted-foreground text-sm">
                  Découvrez où vous pouvez gagner le plus avec notre nouvelle expertise 2025
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold" data-testid="text-benefit-comparaison">Solution de comparaison avancée</h3>
                <p className="text-muted-foreground text-sm">
                  Votre bien analysé face aux ventes récentes pour des résultats optimaux garantis
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold" data-testid="text-benefit-rapport">Rapport détaillé gratuit</h3>
                <p className="text-muted-foreground text-sm">
                  Vous recevez tous les résultats par email - solution complète pour gagner du temps
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
      
      {/* Hero Section */}
      <section className="relative min-h-[50vh] bg-gradient-to-br from-background to-muted flex items-center">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={bordeaux_house}
            alt="Belle propriété en Gironde"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
          {/* Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Prix au mètre carré en Gironde
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mt-3">
              Données du marché immobilier
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-base sm:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Découvrez les prix immobiliers actuels dans les principales villes de la Gironde. 
              Données mises à jour régulièrement selon les transactions récentes.
            </p>
          </div>
        </div>
      </section>

      {/* Price Data Section */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4">
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
      </section>
      
      <Footer domain={domain} />
    </div>
  );
}

// Admin Login Page with 2FA
function AdminLoginPage() {
  const domain = getDomainFromHeaders();
  
  return <Admin2FALogin domain={domain} />;
}

// Legacy Admin Login Page (Simple)
function LegacyAdminLoginPage() {
  const domain = getDomainFromHeaders();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <p>Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
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
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-12 border border-border rounded-md bg-background"
                  data-testid="input-admin-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  data-testid="button-toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

// Guides Page (using the new component)
function GuidesPage() {
  return <GuidesPageComponent />;
}

// Guide Detail Page
function GuideDetailPage() {
  return <GuideDetailPageComponent />;
}

// Actualités Page Wrapper
function ActualitesPage() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <ActualitesPageComponent domain={domain} />
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Article Detail Page Wrapper
function ArticleDetailPage() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <ArticleDetailPageComponent domain={domain} />
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

// Financement Page Wrapper
function FinancementPageComponent() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <FinancementPage domain={domain} />
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Legal Pages Components
function MentionsLegalesPageComponent() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <MentionsLegalesPage domain={domain} />
      </main>
      <Footer domain={domain} />
    </div>
  );
}

function ConfidentialitePageComponent() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <ConfidentialitePage domain={domain} />
      </main>
      <Footer domain={domain} />
    </div>
  );
}

function CookiesPageComponent() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        <CookiesPage domain={domain} />
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Lexique Page
function LexiquePageComponentWrapper() {
  const domain = getDomainFromHeaders();
  
  return <LexiquePageComponent domain={domain} />;
}

// Article Redirect Component
function ArticleRedirect() {
  const params = useParams<{ slug: string }>();
  
  useEffect(() => {
    if (params.slug) {
      // Redirect to the new article URL format
      window.location.replace(`/actualites/${params.slug}`);
    }
  }, [params.slug]);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Redirection en cours...</p>
      </div>
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
      <Route path="/financement" component={FinancementPageComponent} />
      <Route path="/prix-m2" component={PrixM2Page} />
      <Route path="/guides" component={GuidesPage} />
      <Route path="/guides/:slug/merci" component={GuideThanksPage} />
      <Route path="/guides/:slug/lire" component={GuideReadPage} />
      <Route path="/guides/:slug" component={GuideDetailPage} />
      <Route path="/actualites" component={ActualitesPage} />
      <Route path="/actualites/:slug" component={ArticleDetailPage} />
      <Route path="/lexique-immobilier" component={LexiquePageComponentWrapper} />
      {/* Redirect old article URLs to new format */}
      <Route path="/articles/:slug" component={ArticleRedirect} />
      <Route path="/login" component={AdminLoginPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      {/* Legal pages */}
      <Route path="/mentions-legales" component={MentionsLegalesPageComponent} />
      <Route path="/politique-de-confidentialite" component={ConfidentialitePageComponent} />
      <Route path="/politique-cookies" component={CookiesPageComponent} />
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