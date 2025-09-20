import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Home, MapPin, Target, Building2 } from "lucide-react";
import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";

interface TendancesMarche2025PageProps {
  domain?: string;
}

export default function TendancesMarche2025Page({ domain = "estimation-immobilier-gironde.fr" }: TendancesMarche2025PageProps) {
  const websiteUrl = `https://${domain}`;

  return (
    <>
      <SEOHead
        title="Tendances du Marché Immobilier Gironde 2025 | Analyse Complete & Chiffres Clés"
        description="Découvrez l'analyse complète du marché immobilier en Gironde 2025 : tendances, chiffres de population, parc de logements et perspectives d'investissement à Bordeaux et sa métropole."
        keywords={[
          'marché immobilier Gironde 2025',
          'tendances immobilier Bordeaux',
          'chiffres population Gironde',
          'logements Gironde statistiques',
          'investissement immobilier Gironde',
          'prix immobilier 2025',
          'analyse marché Bordeaux',
          'démographie Gironde',
          'construction neuve Gironde'
        ]}
        canonical={`${websiteUrl}/tendances-marche-2025`}
        openGraph={{
          title: "Tendances du Marché Immobilier Gironde 2025",
          description: "Analyse complète du marché immobilier en Gironde 2025 avec chiffres clés et perspectives d'investissement",
          image: bordeaux_house,
          url: `${websiteUrl}/tendances-marche-2025`,
          type: "article"
        }}
        robots="index, follow"
      />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] bg-gradient-to-br from-background to-muted flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={bordeaux_house}
            alt="Marché immobilier Gironde 2025 - Analyse et tendances"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analyse 2025
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Tendances du Marché Immobilier en Gironde
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
              Analyse actualisée avec chiffres clés de population et perspectives d'investissement
            </p>
          </div>
        </div>
      </section>

      {/* Analyse des Tendances */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="w-6 h-6 text-primary" />
                Tendances du marché immobilier en Gironde 2025
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed mb-6">
                Le marché immobilier girondin montre en 2025 des <strong>signes nets d'embellie</strong> après une période de ralentissement. 
                On constate une reprise de la demande, une confiance retrouvée des ménages et un regain d'activité dans la plupart des segments résidentiels.
              </p>
              <p className="text-lg leading-relaxed">
                Bordeaux et sa métropole restent moteur, mais la croissance s'étend aussi aux grandes villes voisines comme 
                <strong> Mérignac, Le Bouscat ou Pessac</strong>, portées par la qualité de vie et l'attractivité régionale. 
                Les prix repartent progressivement à la hausse dans un contexte de demande soutenue.
              </p>
            </CardContent>
          </Card>

          {/* Chiffres clés en grille */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Population */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Chiffres-clés de la population en Gironde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="font-medium">Population totale (1er janvier 2025)</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">1 718 654 habitants</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="font-medium">Densité moyenne</span>
                  <Badge variant="outline">167,9 hab/km²</Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Croissance annuelle (2016-2022)</span>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">+1,1%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Parc de logements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  Parc de logements en Gironde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="font-medium">Total logements (2022)</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">930 035</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="font-medium">Logements commencés (12 mois)</span>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">9 700</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">84,9%</div>
                    <div className="text-xs text-muted-foreground">Résidences principales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">9%</div>
                    <div className="text-xs text-muted-foreground">Résidences secondaires</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">6,1%</div>
                    <div className="text-xs text-muted-foreground">Logements vacants</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>31%</strong> des logements estimés vides ou sous-occupés
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Points forts et enjeux */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="w-6 h-6 text-primary" />
                Points forts et enjeux 2025
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800 dark:text-green-400">Marché Dynamique</h3>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Marché porteur avec <strong>plus de 26 000 annonces</strong>, 
                    dynamique notamment autour de Bordeaux et des grands pôles urbains.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800 dark:text-blue-400">Construction Soutenue</h3>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Constructions neuves soutenues pour répondre à la demande croissante, 
                    tant sur le segment des résidences principales que secondaires.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800 dark:text-purple-400">Conditions Favorables</h3>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Les conditions d'accès au crédit restent favorables, 
                    encourageant transactions et investissements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note de mise à jour */}
          <div className="mt-8 p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground text-center">
              <strong>📊 Données actualisées :</strong> Cette page est mise à jour chaque année aux mêmes périodes 
              pour garantir une information actualisée et pertinente sur le marché girondin.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}