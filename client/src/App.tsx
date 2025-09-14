import { useState, useEffect } from "react";
import { Switch, Route, useRoute, useParams, Redirect, useLocation } from "wouter";
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
import AdminDashboardDev from "@/components/AdminDashboardDev";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import EmailTestPage from "@/pages/EmailTestPage";
import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";
import SEOHead, { createLocalBusinessSchema, createFAQSchema } from "@/components/SEOHead";

// Utility function to detect domain from Host header
function getDomainFromHeaders(): string {
  // TODO: In production, read from Host header via server-side props
  // For now, return default domain for prototype
  return "estimation-immobilier-gironde.fr";
}

// Home Page Component
function HomePage() {
  const domain = getDomainFromHeaders();
  const websiteUrl = `https://${domain}`;
  
  // Form state
  const [propertyType, setPropertyType] = useState("");
  const [surface, setSurface] = useState("");
  const [rooms, setRooms] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleQuickEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!propertyType || !surface || !selectedAddress) {
      setError("Veuillez remplir tous les champs requis");
      return;
    }

    if (parseInt(surface.split('-')[0]) <= 0 && surface !== "200+") {
      setError("Veuillez sélectionner une surface valide");
      return;
    }

    // Open SMS verification popup
    setShowSmsDialog(true);
  };

  const handleVerified = async (sessionId: string) => {
    try {
      const surfaceValue = surface === "200+" ? 250 : 
                          surface.includes('-') ? 
                            parseInt(surface.split('-')[0]) + 25 : 
                            parseInt(surface);

      const response = await fetch('/api/estimations-quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyType: propertyType === "maison" ? "house" : "apartment",
          surface: surfaceValue,
          city: selectedAddress?.city || selectedAddress?.cityName || "Bordeaux",
          address: selectedAddress?.address || selectedAddress?.fullAddress || "Adresse non spécifiée",
          postalCode: selectedAddress?.postalCode || "33000",
          projectType: "renseignement",
          timeline: "6-mois",
          ownershipStatus: "proprietaire",
          wantsExpertContact: false,
          smsVerified: true,
          sessionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Estimation créée !",
          description: "Redirection vers vos résultats..."
        });
        
        // Redirect to results page
        window.location.href = `/estimation-resultats?id=${data.id}`;
      } else {
        setError("Erreur lors de la création de l'estimation");
        setShowSmsDialog(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setError("Erreur lors de la création de l'estimation");
      setShowSmsDialog(false);
    }
  };
  
  // Structured data for local business
  const localBusinessSchema = createLocalBusinessSchema(
    "Estimation Immobilière Gironde",
    "Expert en estimation immobilière gratuite en Gironde. Service d'évaluation précise pour maisons et appartements à Bordeaux et dans toute la Gironde. Technologie IA avancée et données DVF officielles.",
    "33 Rue de la République",
    "Bordeaux", 
    "33000",
    "05.56.00.00.00",
    "contact@estimation-immobilier-gironde.fr",
    websiteUrl
  );
  
  // FAQ Schema for common real estate questions
  const faqSchema = createFAQSchema([
    {
      question: "Comment estimer gratuitement ma maison en Gironde ?",
      answer: "Notre estimateur gratuit utilise l'intelligence artificielle et les données officielles DVF pour analyser plus de 50 critères et vous donner une estimation précise en 3 minutes. Renseignez simplement les caractéristiques de votre bien : type, surface, localisation, état général."
    },
    {
      question: "L'estimation en ligne est-elle fiable en Gironde ?",
      answer: "Oui, notre estimation est basée sur les vraies ventes DVF (Demandes de Valeurs Foncières) de votre quartier et analysée par notre IA exclusive. Nous garantissons des résultats précis en croisant données officielles et critères de marché locaux."
    },
    {
      question: "Combien coûte l'estimation immobilière ?",
      answer: "Notre service d'estimation est 100% gratuit et sans engagement. Vous recevez immédiatement votre fourchette de prix et un rapport détaillé par email, sans aucun frais ni obligation."
    },
    {
      question: "Quels types de biens peut-on estimer en Gironde ?",
      answer: "Nous estimons tous types de biens : maisons, appartements, terrains, propriétés atypiques dans toute la Gironde : Bordeaux, Mérignac, Pessac, Talence, Villenave-d'Ornon, et toutes autres communes."
    },
    {
      question: "Puis-je avoir une expertise officielle après l'estimation ?",
      answer: "Oui, si vous souhaitez une expertise officielle certifiée, nous pouvons vous mettre en relation avec nos experts partenaires agréés en Gironde pour un diagnostic approfondi de votre bien."
    }
  ]);
  
  return (
    <>
      <SEOHead
        title="Estimation Immobilière Gratuite Gironde | Expert Local Bordeaux 2025"
        description="✅ Estimation gratuite et instantanée de votre bien en Gironde. IA + données DVF officielles = résultats précis garantis. Expert local Bordeaux. Rapport détaillé offert."
        keywords={[
          'estimation immobilière Gironde',
          'estimation gratuite Bordeaux', 
          'prix immobilier Gironde',
          'évaluation maison Bordeaux',
          'estimation appartement Gironde',
          'expert immobilier Bordeaux',
          'DVF Gironde',
          'prix m2 Bordeaux',
          'vendre maison Gironde',
          'estimation en ligne gratuite'
        ]}
        canonical={websiteUrl}
        openGraph={{
          title: "Estimation Immobilière Gratuite Gironde | Expert Local",
          description: "Estimation gratuite et instantanée de votre bien en Gironde avec l'IA + données DVF officielles. Résultats précis garantis en 3 minutes.",
          image: bordeaux_house,
          url: websiteUrl,
          type: "website",
          siteName: "Estimation Immobilière Gironde"
        }}
        twitterCard={{
          card: "summary_large_image",
          site: "@EstimationGironde",
          title: "Estimation Immobilière Gratuite Gironde",
          description: "Estimation gratuite et instantanée avec IA + données DVF. Résultats précis en 3 minutes.",
          image: bordeaux_house
        }}
        structuredData={[localBusinessSchema, faqSchema]}
        robots="index, follow"
      />
        <Hero domain={domain} />
        
        {/* Section d'estimation rapide */}
        <section className="py-8 bg-background border-b">
          <div className="max-w-6xl mx-auto px-4">
            <form onSubmit={handleQuickEstimate}>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Estimation rapide :</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <AddressAutocomplete
                    onAddressSelect={(address) => setSelectedAddress(address)}
                    placeholder="Adresse du bien"
                    className="px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[200px]"
                    data-testid="filter-city"
                  />
                  <select 
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
                    data-testid="filter-property-type"
                  >
                    <option value="">Type de bien</option>
                    <option value="maison">Maison</option>
                    <option value="appartement">Appartement</option>
                    <option value="terrain">Terrain</option>
                  </select>
                  <select 
                    value={surface}
                    onChange={(e) => setSurface(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
                    data-testid="filter-surface"
                  >
                    <option value="">Surface (m²)</option>
                    <option value="0-50">- 50 m²</option>
                    <option value="50-80">50 - 80 m²</option>
                    <option value="80-120">80 - 120 m²</option>
                    <option value="120-200">120 - 200 m²</option>
                    <option value="200+">200+ m²</option>
                  </select>
                  <select 
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
                    data-testid="filter-rooms"
                  >
                    <option value="">Pièces (optionnel)</option>
                    <option value="1-2">1-2 pièces</option>
                    <option value="3">3 pièces</option>
                    <option value="4">4 pièces</option>
                    <option value="5+">5+ pièces</option>
                  </select>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover-elevate transition-colors" 
                    data-testid="button-estimate"
                  >
                    Demander une estimation
                  </button>
                </div>
              </div>
              {error && (
                <div className="text-center mt-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Popup de vérification SMS */}
        <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Vérification SMS</DialogTitle>
              <DialogDescription>
                Pour sécuriser votre estimation et vous envoyer les résultats
              </DialogDescription>
            </DialogHeader>
            <SmsVerificationHome 
              propertyData={{
                propertyType: propertyType === "maison" ? "Maison" : "Appartement", 
                surface: surface,
                city: selectedAddress?.city || selectedAddress?.cityName || "Non spécifié"
              }}
              onVerified={handleVerified}
              onBack={() => setShowSmsDialog(false)}
            />
          </DialogContent>
        </Dialog>
        
        
        {/* 3 Blocs Section */}
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                De l'incertitude à la certitude
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Découvrez comment nous transformons vos doutes en confiance grâce à notre approche transparente et nos données fiables
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Ce que vous ressentez */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 p-2 rounded-lg">
                    <Brain className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Ce que vous ressentez aujourd'hui</h3>
                </div>
                <ul className="space-y-3">
                  <li className="text-sm text-muted-foreground">Vous doutez du prix annoncé par votre agent.</li>
                  <li className="text-sm text-muted-foreground">Vous craignez de vendre trop bas et de perdre de l'argent.</li>
                  <li className="text-sm text-muted-foreground">Vous cherchez une solution gratuite, fiable et sans arrière-pensée commerciale.</li>
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
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Des résultats fiables basés sur les ventes réelles (DVF) de votre quartier.</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Une analyse complète de plus de 50 critères qui influencent la valeur d'un bien.</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Un rapport détaillé gratuit pour négocier en position de force.</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Une solution 100% gratuite, sans engagement, résultats rapides.</span>
                  </li>
                </ul>
              </div>

              {/* Comment ça fonctionne */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <Rocket className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Comment ça fonctionne (3 étapes simples)</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">1</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Décrivez votre bien</p>
                      <p className="text-xs text-muted-foreground">Type, surface, ville, état général (2 minutes).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">2</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Analyse locale</p>
                      <p className="text-xs text-muted-foreground">Croisement avec les ventes DVF + tendances marché.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">3</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Recevez votre estimation</p>
                      <p className="text-xs text-muted-foreground">Fourchette précise + rapport complet envoyé par email.</p>
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
              <h2 className="text-3xl font-bold mb-4">Pourquoi choisir notre solution d'estimation en Gironde ?</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold" data-testid="text-benefit-instantanee">Résultats instantanés et gratuits</h3>
                <p className="text-muted-foreground text-sm">
                  Obtenez votre estimation rapidement et sans frais
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold" data-testid="text-benefit-quartiers">Analyse sectorielle détaillée</h3>
                <p className="text-muted-foreground text-sm">
                  Découvrez où votre bien vaut le plus grâce à notre expertise locale
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold" data-testid="text-benefit-comparaison">Comparaison avec les ventes récentes</h3>
                <p className="text-muted-foreground text-sm">
                  Analyse des transactions similaires pour une estimation optimale
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6">
                <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold" data-testid="text-benefit-rapport">Rapport complet envoyé par email</h3>
                <p className="text-muted-foreground text-sm">
                  Recevez directement votre étude détaillée dans votre boite mail
                </p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-lg font-semibold text-primary">
                📍 Estimation immobilière Gironde – votre solution locale à Bordeaux et dans tout le département
              </p>
            </div>
          </div>
        </section>
    </>
  );
}

// Estimation Page
function EstimationPage() {
  return <PropertyEstimationForm />;
}

// Results Page
function ResultsPage() {
  return <EstimationResults />;
}

// Contact Page
function ContactPage() {
  return <ContactForm />;
}

// Prix m² Page
function PrixM2Page() {
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
    <>
      
      {/* Hero Section */}
      <section className="relative min-h-[50vh] bg-gradient-to-br from-background to-muted flex items-center">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={bordeaux_house}
            alt="Estimation gratuite maison Bordeaux Gironde - Expert immobilier local"
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
    </>
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
  const domain = getDomainFromHeaders();
  
  // AdminDashboard has its own sidebar layout, no need to wrap
  return <AdminDashboard domain={domain} />;
}

// Admin Dashboard Page for Development (no auth)
function AdminDashboardPageDev() {
  const domain = getDomainFromHeaders();
  
  // Development version - bypass authentication
  return <AdminDashboardDev domain={domain} />;
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
  
  return <ActualitesPageComponent domain={domain} />;
}

// Article Detail Page Wrapper
function ArticleDetailPage() {
  const domain = getDomainFromHeaders();
  
  return <ArticleDetailPageComponent domain={domain} />;
}

// NotFound Page
function NotFound() {
  return (
    <div className="py-16">
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
    </div>
  );
}

// Financement Page Wrapper
function FinancementPageComponent() {
  const domain = getDomainFromHeaders();
  
  return <FinancementPage domain={domain} />;
}

// Legal Pages Components
function MentionsLegalesPageComponent() {
  const domain = getDomainFromHeaders();
  
  return <MentionsLegalesPage domain={domain} />;
}

function ConfidentialitePageComponent() {
  const domain = getDomainFromHeaders();
  
  return <ConfidentialitePage domain={domain} />;
}

function CookiesPageComponent() {
  const domain = getDomainFromHeaders();
  
  return <CookiesPage domain={domain} />;
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

// Guide Redirect Component (for legacy /guide/ URLs)
function GuideRedirect() {
  const params = useParams<{ slug: string }>();
  
  useEffect(() => {
    if (params.slug) {
      // Redirect to the new guide URL format
      window.location.replace(`/guides/${params.slug}`);
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

// Public Layout Component - provides Header + Footer for public pages
function PublicLayout({ children }: { children: React.ReactNode }) {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main>
        {children}
      </main>
      <Footer />
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
      {/* Redirect old URLs to new format */}
      <Route path="/articles/:slug" component={ArticleRedirect} />
      <Route path="/guide/:slug" component={GuideRedirect} />
      <Route path="/email-test" component={EmailTestPage} />
      <Route path="/admin-dev" component={AdminDashboardPageDev} />
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
  const [location] = useLocation();
  
  // Check if this is an admin route or results page that should not use PublicLayout
  const isAdminRoute = location.startsWith('/admin') || location === '/admin-dev' || location === '/login' || location === '/gironde-login' || location === '/gironde-admin-dashboard';
  const isResultsPage = location === '/estimation-resultats' || location.startsWith('/estimation-resultats');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {isAdminRoute || isResultsPage ? (
            // Admin routes and results page render without PublicLayout
            <>
              <Router />
              <Toaster />
            </>
          ) : (
            // Public routes use PublicLayout with Header + Footer
            <>
              <PublicLayout>
                <Router />
              </PublicLayout>
              <Toaster />
            </>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}