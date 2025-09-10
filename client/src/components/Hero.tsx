import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, MapPin, Award, Users } from "lucide-react";
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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Estimation gratuite de votre bien en{" "}
                <span className="text-primary">{cityName}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Obtenez une estimation précise et instantanée de votre propriété. 
                Notre expertise locale vous garantit une évaluation fiable.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/estimation" data-testid="button-start-estimation">
                <Button size="lg" className="w-full sm:w-auto">
                  <Calculator className="h-5 w-5 mr-2" />
                  Estimer mon bien
                </Button>
              </Link>
              <Link href="/prix-m2" data-testid="button-price-m2">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-background/80 backdrop-blur-sm">
                  <MapPin className="h-5 w-5 mr-2" />
                  Prix au m² {cityName}
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">+2,500</p>
                <p className="text-xs text-muted-foreground">Estimations</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-2">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Expert</p>
                <p className="text-xs text-muted-foreground">Certifié</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-2">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Local</p>
                <p className="text-xs text-muted-foreground">{cityName}</p>
              </div>
            </div>
          </div>

          {/* Quick Estimation Card */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-card-border">
            <h3 className="text-xl font-semibold mb-4 text-card-foreground">
              Estimation rapide
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
                  Obtenir mon estimation
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}