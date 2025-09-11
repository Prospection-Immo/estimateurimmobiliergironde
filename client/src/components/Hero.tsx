import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, MapPin, Shield, BarChart3, Zap } from "lucide-react";
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
        {/* Centered Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Estimation immobilière en Gironde
          </h1>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Chaque mois en Gironde, des centaines de propriétaires comme vous perdent des milliers d'euros en vendant leur bien 15 à 30% sous sa vraie valeur. 
                Notre nouvelle solution d'estimation vous garantit d'éviter cette erreur coûteuse.
              </p>
            </div>

          </div>

          {/* Quick Estimation Card */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-card-border">
            <h3 className="text-xl font-semibold mb-4 text-card-foreground text-center">
              Découvrez la valeur réelle de votre bien sur le prix du marché
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