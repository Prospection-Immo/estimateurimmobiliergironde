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
import { useToast } from "@/hooks/use-toast";
import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";

interface EstimationMaisonGirondePageProps {
  domain?: string;
}

export default function EstimationMaisonGirondePage({ 
  domain = "estimation-immobilier-gironde.fr" 
}: EstimationMaisonGirondePageProps) {
  const websiteUrl = `https://${domain}`;
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    commune: "",
    surface: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Demande de rappel envoyée",
      description: "Un expert vous contactera sous 1h pour votre estimation gratuite.",
    });
    setFormData({ nom: "", telephone: "", commune: "", surface: "" });
  };

  return (
    <>
      <SEOHead
        title="Estimation Maison Gironde | Expert Local Gratuit"
        description="Faites estimer votre maison en Gironde gratuitement. Analyse locale, prix au m², comparables DVF et appel direct avec un expert immobilier."
        keywords={[
          'estimation maison gironde',
          'prix maison bordeaux',
          'expert immobilier gironde',
          'estimation gratuite gironde',
          'vendre maison gironde',
          'arcachon pessac medoc',
          'prix m2 gironde',
          'DVF gironde'
        ]}
        canonical={`${websiteUrl}/estimation-maison-gironde`}
        openGraph={{
          title: "Estimation Maison Gironde | Expert Local Gratuit",
          description: "Faites estimer votre maison en Gironde gratuitement. Analyse locale, prix au m², comparables DVF et appel direct avec un expert immobilier.",
          image: bordeaux_house,
          url: `${websiteUrl}/estimation-maison-gironde`,
          type: "website"
        }}
        robots="index, follow"
      />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] bg-gradient-to-br from-background to-muted flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={bordeaux_house}
            alt="Estimation maison Gironde"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Estimation de Maison en Gironde
              <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2">(Appel Gratuit)</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-4xl mx-auto mb-8">
              Vous envisagez de vendre votre maison en Gironde ? Obtenez une estimation gratuite et fiable, 
              réalisée par un expert local basé sur les ventes réelles (DVF) et les particularités de votre bien.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
                data-testid="button-call-hero"
              >
                <Phone className="w-5 h-5 mr-2" />
                Appeler maintenant un conseiller
              </Button>
            </div>
            <p className="text-white/80 text-sm mt-3">
              Lun-Sam, 9h-19h — gratuit et sans engagement
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        
        {/* Pourquoi estimer */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="w-6 h-6 text-primary" />
                Pourquoi estimer votre maison avant de vendre ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Éviter de sous-évaluer</h3>
                      <p className="text-sm text-muted-foreground">et perdre 10 à 20 % du prix réel</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Fixer un prix de marché compétitif</h3>
                      <p className="text-sm text-muted-foreground">pour vendre rapidement</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Rassurer acheteurs et notaires</h3>
                      <p className="text-sm text-muted-foreground">avec une valeur crédible</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Obtenir un avis local personnalisé</h3>
                      <p className="text-sm text-muted-foreground">pas une simple calculette en ligne</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button size="lg" data-testid="button-call-estimation">
                  <Phone className="w-4 h-4 mr-2" />
                  Je veux mon estimation gratuite
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Prix au m² */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="w-6 h-6 text-primary" />
                Prix au m² en Gironde (2025)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                Le prix d'une maison dépend de sa commune, son état et ses atouts.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Bordeaux Métropole</h3>
                  <p className="text-2xl font-bold mt-2">4 200 – 5 500 €/m²</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Arcachon / Bassin</h3>
                  <p className="text-2xl font-bold mt-2">5 000 – 8 000 €/m²</p>
                  <p className="text-sm text-muted-foreground mt-1">(maisons avec vue)</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Médoc & Littoral</h3>
                  <p className="text-2xl font-bold mt-2">2 800 – 3 500 €/m²</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Entre-Deux-Mers</h3>
                  <p className="text-2xl font-bold mt-2">2 200 – 2 800 €/m²</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-primary">Sud Gironde</h3>
                  <p className="text-2xl font-bold mt-2">1 800 – 2 400 €/m²</p>
                  <p className="text-sm text-muted-foreground mt-1">(Langon, La Réole...)</p>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="flex items-center gap-2">
                  <span className="text-2xl">👉</span>
                  <span>Un expert affine votre prix selon l'emplacement exact, la surface et l'état de votre maison.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Méthodologie */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="w-6 h-6 text-primary" />
                Notre méthode d'estimation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                Une démarche simple, rapide et transparente.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Badge variant="outline" className="min-w-fit">1</Badge>
                  <div>
                    <h3 className="font-semibold">Décrivez votre maison</h3>
                    <p className="text-muted-foreground">surface, terrain, état, commune</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Badge variant="outline" className="min-w-fit">2</Badge>
                  <div>
                    <h3 className="font-semibold">Analyse locale croisée</h3>
                    <p className="text-muted-foreground">avec DVF + tendances récentes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Badge variant="outline" className="min-w-fit">3</Badge>
                  <div>
                    <h3 className="font-semibold">Résultat clair</h3>
                    <p className="text-muted-foreground">fourchette réaliste + prix conseillé</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg mt-6">
                <p className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  <span><strong>Un appel de 15 minutes suffit</strong> pour obtenir un premier avis.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Témoignages */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="w-6 h-6 text-primary" />
                Avis & Témoignages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="italic">"Estimation juste, maison vendue en 3 semaines à Pessac."</p>
                  <p className="text-sm text-muted-foreground mt-2">— Claire B.</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="italic">"Rapide et fiable, avec rapport PDF reçu sous 48h."</p>
                  <p className="text-sm text-muted-foreground mt-2">— Jean-Marc T., Arcachon</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="italic">"Bonne analyse du terrain et des travaux à prévoir."</p>
                  <p className="text-sm text-muted-foreground mt-2">— Isabelle R., Langon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">L'estimation est-elle gratuite ?</h3>
                  <p className="text-muted-foreground">Oui, l'appel est 100 % gratuit et sans engagement.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Recevrai-je un rapport écrit ?</h3>
                  <p className="text-muted-foreground">Oui, un PDF peut être envoyé sous 48h si vous le souhaitez.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Quels types de maisons sont couverts ?</h3>
                  <p className="text-muted-foreground">Pavillons, maisons de ville, villas, propriétés viticoles.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Travaillez-vous dans tout le département ?</h3>
                  <p className="text-muted-foreground">Oui, nous couvrons Bordeaux, Bassin d'Arcachon, Médoc, Libourne, Entre-Deux-Mers et Sud Gironde.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact & Appel */}
        <section>
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
                    <h3 className="text-xl font-semibold mb-2">Appeler maintenant un expert Gironde</h3>
                    <Button size="lg" className="mb-4" data-testid="button-call-main">
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler maintenant
                    </Button>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Réponse immédiate</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Estimation gratuite & fiable</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>Disponible Lun-Sam 9h-19h</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Formulaire simple (optionnel, pour rappel rapide)</h3>
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
                      <Label htmlFor="commune">Commune</Label>
                      <Input 
                        id="commune"
                        value={formData.commune}
                        onChange={(e) => setFormData({...formData, commune: e.target.value})}
                        placeholder="ex: Pessac, Arcachon..."
                        data-testid="input-commune"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="surface">Surface (m²)</Label>
                      <Input 
                        id="surface"
                        value={formData.surface}
                        onChange={(e) => setFormData({...formData, surface: e.target.value})}
                        placeholder="ex: 120"
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