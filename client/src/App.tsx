import { Switch, Route } from "wouter";
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
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Prix au m² en Gironde</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* TODO: Replace with real data */}
            {[
              { city: "Bordeaux", priceM2: 4200, change: "+2.1%" },
              { city: "Mérignac", priceM2: 3800, change: "+1.8%" },
              { city: "Pessac", priceM2: 3600, change: "+1.5%" },
              { city: "Talence", priceM2: 3900, change: "+2.3%" },
              { city: "Bègles", priceM2: 3400, change: "+1.2%" },
              { city: "Villenave-d'Ornon", priceM2: 3200, change: "+0.9%" }
            ].map((city) => (
              <div key={city.city} className="bg-card p-6 rounded-lg border border-card-border hover-elevate">
                <h3 className="font-semibold text-lg mb-2">{city.city}</h3>
                <p className="text-2xl font-bold text-primary mb-1">
                  {city.priceM2.toLocaleString()} €/m²
                </p>
                <p className="text-sm text-chart-2">{city.change} vs année dernière</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer domain={domain} />
    </div>
  );
}

// Admin Login Page (Simple)
function AdminLoginPage() {
  const domain = getDomainFromHeaders();
  
  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      <main className="py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-card p-8 rounded-lg border border-card-border">
            <h1 className="text-2xl font-bold mb-6 text-center">Connexion Admin</h1>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom d'utilisateur</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-border rounded-md bg-background"
                  data-testid="input-admin-username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe</label>
                <input 
                  type="password" 
                  className="w-full p-3 border border-border rounded-md bg-background"
                  data-testid="input-admin-password"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-primary text-primary-foreground p-3 rounded-md hover-elevate"
                data-testid="button-admin-login"
              >
                Se connecter
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