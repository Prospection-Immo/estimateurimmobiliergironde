import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, MapPin, Shield, BarChart3, Zap, Brain, Target, Rocket, Check } from "lucide-react";
import { Link } from "wouter";
import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";

interface HeroProps {
  domain?: string;
}

export default function Hero({ domain = "estimation-immobilier-gironde.fr" }: HeroProps) {
  const isGironde = domain.includes("gironde");
  const cityName = isGironde ? "Gironde" : "Bordeaux";

  return (
    <section className="relative min-h-[60vh] bg-gradient-to-br from-background to-muted">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={bordeaux_house}
          alt="Belle propriété en Gironde"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/60"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-center">
                Estimation immobilière en Gironde
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Chaque mois en Gironde, des centaines de propriétaires comme vous perdent des milliers d'euros en vendant leur bien 15 à 30% sous sa vraie valeur. 
                Notre nouvelle solution d'estimation vous garantit d'éviter cette erreur coûteuse.
              </p>
            </div>

            {/* Ce que vous ressentez */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/10 p-2 rounded-lg">
                  <Brain className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Ce que vous ressentez aujourd'hui</h3>
              </div>
              <ul className="space-y-2 ml-10">
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
                <h3 className="text-lg font-semibold text-foreground">La solution que vous méritez</h3>
              </div>
              <ul className="space-y-2 ml-10">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Des résultats garantis basés sur les vraies ventes DVF de votre quartier
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Notre nouvelle analyse IA exclusive de 50+ critères prix
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Un rapport détaillé gratuit pour vous faire économiser et gagner en négociation
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Solution 100% gratuite, sans engagement, résultats garantis en 3 minutes
                </li>
              </ul>
            </div>

            {/* Comment ça fonctionne */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <Rocket className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Comment ça fonctionne (plan en 3 étapes)</h3>
              </div>
              <div className="grid gap-4 ml-10">
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

          {/* Quick Estimation Card */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-card-border">
            <h3 className="text-xl font-semibold mb-4 text-card-foreground">
              Obtenez gratuitement la vraie valeur de votre bien
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-card-foreground">Type</label>
                  <select className="w-full mt-1 p-2 border border-border rounded-md bg-background" data-testid="select-property-type">
                    <option>Maison</option>
                    <option>Appartement</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground">Surface</label>
                  <input
                    type="number"
                    placeholder="m²"
                    className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                    data-testid="input-surface"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground">Ville</label>
                <input
                  type="text"
                  placeholder="Ex: Bordeaux"
                  className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                  data-testid="input-city"
                />
              </div>
              <Link href="/estimation" className="block">
                <Button className="w-full" data-testid="button-quick-estimate">
                  Découvrir mes résultats maintenant
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}