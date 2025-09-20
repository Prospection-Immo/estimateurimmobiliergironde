import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  CheckCircle, 
  Clock,
  Home,
  FileText,
  TrendingUp,
  Users,
  Target
} from "lucide-react";
import { Link } from "wouter";
import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";

interface MerciEstimationAppartementBordeauxPageProps {
  domain?: string;
}

export default function MerciEstimationAppartementBordeauxPage({ 
  domain = "estimation-immobilier-gironde.fr" 
}: MerciEstimationAppartementBordeauxPageProps) {
  const websiteUrl = `https://${domain}`;

  return (
    <>
      <SEOHead
        title="Merci – Estimation Appartement Bordeaux | Expert Local"
        description="Merci pour votre demande d'estimation d'appartement à Bordeaux. Un conseiller expert local vous rappelle rapidement pour confirmer la valeur de votre bien."
        keywords={[
          'merci estimation appartement bordeaux',
          'confirmation estimation bordeaux',
          'expert immobilier bordeaux rappel',
          'estimation appartement chartrons',
          'DVF bordeaux appartement',
          'conseils vente appartement bordeaux'
        ]}
        canonical={`${websiteUrl}/merci-estimation-appartement-bordeaux`}
        openGraph={{
          title: "Merci – Estimation Appartement Bordeaux | Expert Local",
          description: "Merci pour votre demande d'estimation d'appartement à Bordeaux. Un conseiller expert local vous rappelle rapidement pour confirmer la valeur de votre bien.",
          image: bordeaux_house,
          url: `${websiteUrl}/merci-estimation-appartement-bordeaux`,
          type: "website"
        }}
        robots="noindex, nofollow"
      />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={bordeaux_house}
            alt="Estimation appartement Bordeaux confirmée"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-green-800/70"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
          <div className="text-center mb-8">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Merci pour votre demande d'estimation d'appartement à Bordeaux
            </h1>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-3xl mx-auto">
              <p className="text-lg sm:text-xl text-white/95 mb-4">
                <strong>Votre demande a bien été enregistrée ✅</strong>
              </p>
              <p className="text-lg text-white/90">
                Un expert local bordelais va vous rappeler dans les prochaines minutes pour confirmer les informations 
                et vous fournir une estimation fiable de votre appartement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        
        {/* Ce qui va se passer maintenant */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Clock className="w-6 h-6 text-primary" />
                Ce qui va se passer maintenant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Un conseiller vous appelle</h3>
                    <p className="text-muted-foreground">généralement sous 15 minutes, horaires : Lun-Sam 9h-19h</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Vous présentez brièvement votre appartement</h3>
                    <p className="text-muted-foreground">surface, quartier, étage, état, luminosité</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">L'expert croise vos données</h3>
                    <p className="text-muted-foreground">avec les ventes réelles (DVF) et les comparables de votre quartier</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Vous recevez une fourchette d'estimation immédiate</h3>
                    <p className="text-muted-foreground">résultat direct au téléphone</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">En option : un rapport détaillé PDF sous 48h</h3>
                    <p className="text-muted-foreground">gratuit si vous le souhaitez</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* En attendant, découvrez */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">En attendant, découvrez…</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">👉</span>
                Nos conseils pour mieux vendre votre appartement à Bordeaux :
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>Fixer un prix réaliste selon votre quartier (Chartrons, Caudéran, etc.)</span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>Valoriser vos atouts (balcon, parking, rénovation récente)</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>Optimiser la luminosité et l'agencement pour les visites</span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span>Bien choisir le moment de mise en vente selon votre secteur bordelais</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">Lien utile (interne SEO) :</p>
                <Link href="/prix-m2" className="text-primary hover:underline font-medium" data-testid="link-prix-m2">
                  ➡️ Consultez le prix moyen au m² à Bordeaux par quartier
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Besoin d'aller plus vite */}
        <section>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Phone className="w-6 h-6 text-primary" />
                Besoin d'aller plus vite ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-6">
                Vous pouvez nous appeler directement pour accélérer le processus :
              </p>
              
              <div className="text-center">
                <Button size="lg" className="text-lg px-8 py-4" data-testid="button-call-direct">
                  <Phone className="w-5 h-5 mr-2" />
                  Appeler un expert maintenant
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Rappel des avantages */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Rappel des avantages de notre estimation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Gratuite & sans engagement</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Basée sur les données DVF officielles</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Adaptée à votre appartement et votre quartier bordelais</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Résultats rapides (15 min par téléphone, 48h pour le rapport PDF)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Message de réassurance final */}
        <section>
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">Message de réassurance final</h2>
              <p className="text-lg italic text-muted-foreground">
                "Votre appartement mérite une estimation juste. Notre mission : vous aider à vendre au vrai prix du marché bordelais, sans perte de valeur."
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}