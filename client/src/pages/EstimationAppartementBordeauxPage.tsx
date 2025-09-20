import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Star,
  Home,
  TrendingUp,
  Users,
  FileText,
  Target
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";

interface EstimationAppartementBordeauxPageProps {
  domain?: string;
}

export default function EstimationAppartementBordeauxPage({ 
  domain = "estimation-immobilier-gironde.fr" 
}: EstimationAppartementBordeauxPageProps) {
  const websiteUrl = `https://${domain}`;
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    quartier: "",
    surface: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Rediriger vers la page de remerciement
    navigate("/merci-estimation-appartement-bordeaux");
  };

  return (
    <>
      <SEOHead
        title="Estimation Appartement Bordeaux | Expert Local Gratuit"
        description="Obtenez une estimation fiable de votre appartement à Bordeaux. Analyse locale, prix au m², comparables DVF et appel gratuit avec un expert. Résultat en 48h."
        keywords={[
          'estimation appartement bordeaux',
          'prix appartement bordeaux',
          'expert immobilier bordeaux',
          'estimation gratuite bordeaux',
          'vendre appartement bordeaux',
          'chartrons caudéran nansouty',
          'prix m2 bordeaux',
          'DVF bordeaux'
        ]}
        canonical={`${websiteUrl}/estimation-appartement-bordeaux`}
        openGraph={{
          title: "Estimation Appartement Bordeaux | Expert Local Gratuit",
          description: "Obtenez une estimation fiable de votre appartement à Bordeaux. Analyse locale, prix au m², comparables DVF et appel gratuit avec un expert.",
          image: bordeaux_house,
          url: `${websiteUrl}/estimation-appartement-bordeaux`,
          type: "website"
        }}
        robots="index, follow"
      />


      {/* Hero Section */}
      <section id="accueil" className="relative min-h-[60vh] bg-gradient-to-br from-background to-muted flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={bordeaux_house}
            alt="Estimation appartement Bordeaux"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Estimation d'Appartement à Bordeaux
              <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2">(Appel Gratuit)</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-4xl mx-auto mb-8">
              Votre prix de vente est la clé pour réussir votre transaction.
              Avec un expert local bordelais, vous obtenez une estimation précise et gratuite, 
              basée sur les ventes réelles (DVF) et les particularités de votre appartement.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
                data-testid="button-call-hero"
              >
                <Phone className="w-5 h-5 mr-2" />
                Appeler maintenant — Estimation immédiate en 15 minutes
              </Button>
            </div>
            <p className="text-white/80 text-sm mt-3">
              Lun-Sam 9h-19h — Gratuit et sans engagement
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        
        {/* Estimation gratuite */}
        <section id="estimation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="w-6 h-6 text-primary" />
                Estimation gratuite — Pourquoi c'est utile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Les propriétaires bordelais perdent parfois 10 à 20 % faute de bonne estimation. Notre approche évite cet écueil.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Résultats rapides</h3>
                      <p className="text-sm text-muted-foreground">Fourchette fiable dès l'appel</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Données officielles DVF</h3>
                      <p className="text-sm text-muted-foreground">Transactions récentes à Bordeaux</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Analyse personnalisée</h3>
                      <p className="text-sm text-muted-foreground">Étage, luminosité, DPE, extérieur</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Rapport complet (optionnel)</h3>
                      <p className="text-sm text-muted-foreground">PDF envoyé sous 48h</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button size="lg" data-testid="button-call-estimation">
                  <Phone className="w-4 h-4 mr-2" />
                  Obtenir mon estimation
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Prix au m² */}
        <section id="prix">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="w-6 h-6 text-primary" />
                Prix au m² à Bordeaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                Les prix au m² varient fortement selon les quartiers et les caractéristiques.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Centre & Saint-Pierre</h3>
                  <p className="text-2xl font-bold mt-2">5 000 – 6 000 €/m²</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Chartrons</h3>
                  <p className="text-2xl font-bold mt-2">4 800 – 5 500 €/m²</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Caudéran</h3>
                  <p className="text-2xl font-bold mt-2">4 200 – 4 800 €/m²</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Nansouty</h3>
                  <p className="text-2xl font-bold mt-2">3 800 – 4 500 €/m²</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Bacalan</h3>
                  <p className="text-2xl font-bold mt-2">3 500 – 4 200 €/m²</p>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="flex items-center gap-2">
                  <span className="text-2xl">👉</span>
                  <span>Ces prix évoluent vite : seul un appel avec un expert confirme la valeur réelle de votre appartement.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quartiers */}
        <section id="quartiers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MapPin className="w-6 h-6 text-primary" />
                Quartiers bordelais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                Chaque quartier a ses spécificités qui influencent le prix.
              </p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Chartrons</h3>
                  <p className="text-muted-foreground">Très recherché, forte demande pour les appartements rénovés</p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Saint-Pierre</h3>
                  <p className="text-muted-foreground">Cœur historique, prix élevés pour petites surfaces</p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Caudéran</h3>
                  <p className="text-muted-foreground">Familial, grands appartements, prix stables</p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Nansouty</h3>
                  <p className="text-muted-foreground">En plein essor, bon rapport prix/surface</p>
                </div>
                
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Bacalan</h3>
                  <p className="text-muted-foreground">Dynamique, prix attractifs mais en progression</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Méthodologie */}
        <section id="methodologie">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="w-6 h-6 text-primary" />
                Notre méthode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                Transparence et rigueur pour inspirer confiance.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Badge variant="outline" className="min-w-fit">Étape 1</Badge>
                  <div>
                    <h3 className="font-semibold">Décrivez votre appartement</h3>
                    <p className="text-muted-foreground">Surface, étage, état</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Badge variant="outline" className="min-w-fit">Étape 2</Badge>
                  <div>
                    <h3 className="font-semibold">Analyse croisée</h3>
                    <p className="text-muted-foreground">Avec DVF et comparables récents</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Badge variant="outline" className="min-w-fit">Étape 3</Badge>
                  <div>
                    <h3 className="font-semibold">Résultat clair</h3>
                    <p className="text-muted-foreground">Fourchette + prix conseillé</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg mt-6">
                <p className="flex items-center gap-2">
                  <span className="text-2xl">👉</span>
                  <span>15 minutes suffisent pour un premier avis, rapport complet possible sous 48h.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Témoignages */}
        <section id="preuves">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="w-6 h-6 text-primary" />
                Avis & Témoignages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                La preuve sociale rassure et incite à l'action.
              </p>
              
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="italic">"Estimation juste, compromis signé en 12 jours à Caudéran."</p>
                  <p className="text-sm text-muted-foreground mt-2">— Pauline D.</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="italic">"Très pro, rapport PDF précis pour mon appart aux Chartrons."</p>
                  <p className="text-sm text-muted-foreground mt-2">— Xavier L.</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="italic">"Conseils utiles pour fixer un prix réaliste à Nansouty."</p>
                  <p className="text-sm text-muted-foreground mt-2">— Sabrina M.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section id="faq">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Combien coûte l'estimation ?</h3>
                  <p className="text-muted-foreground">Elle est 100 % gratuite par téléphone.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Recevrai-je un document ?</h3>
                  <p className="text-muted-foreground">Oui, un rapport PDF détaillé peut vous être envoyé.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Quels quartiers couvrez-vous ?</h3>
                  <p className="text-muted-foreground">Tous les quartiers de Bordeaux et CUB (Caudéran, Chartrons, Bacalan, etc.).</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Est-ce fiable ?</h3>
                  <p className="text-muted-foreground">Basé sur DVF et plus de 50 critères objectifs.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact & Appel */}
        <section id="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Phone className="w-6 h-6 text-primary" />
                Contact & Appel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="text-center p-6 bg-primary/10 rounded-lg">
                    <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Appelez directement un expert local</h3>
                    <Button size="lg" className="mb-4" data-testid="button-call-main">
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler maintenant
                    </Button>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Réponse en moins de 15 minutes</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Estimation gratuite, sans engagement</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>Disponible Lun-Sam, 9h-19h</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Formulaire rapide (optionnel)</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="nom">Nom</Label>
                      <Input 
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        data-testid="input-nom"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="telephone">Téléphone</Label>
                      <Input 
                        id="telephone"
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                        data-testid="input-telephone"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="quartier">Quartier</Label>
                      <Input 
                        id="quartier"
                        value={formData.quartier}
                        onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                        placeholder="ex: Chartrons, Caudéran..."
                        data-testid="input-quartier"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="surface">Surface (m²)</Label>
                      <Input 
                        id="surface"
                        value={formData.surface}
                        onChange={(e) => setFormData({...formData, surface: e.target.value})}
                        placeholder="ex: 65"
                        data-testid="input-surface"
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" data-testid="button-callback">
                      Être rappelé sous 1h
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}