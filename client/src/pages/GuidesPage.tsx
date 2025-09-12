import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Clock, Users, Download, ArrowRight, Filter, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Guide, GUIDE_PERSONAS } from "@shared/schema";
import SEOHead from "@/components/SEOHead";

export default function GuidesPage() {
  const [selectedPersona, setSelectedPersona] = useState<string>("");

  const { data: guides = [], isLoading } = useQuery<Guide[]>({
    queryKey: ['/api/guides', selectedPersona],
    queryFn: async () => {
      const url = selectedPersona 
        ? `/api/guides?persona=${encodeURIComponent(selectedPersona)}`
        : '/api/guides';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch guides');
      }
      return response.json();
    },
    enabled: true
  });

  const personaStats = Object.keys(GUIDE_PERSONAS).map(persona => ({
    key: persona,
    label: GUIDE_PERSONAS[persona as keyof typeof GUIDE_PERSONAS],
    count: guides.filter(g => g.persona === persona).length
  }));

  // Structured data for guides catalog
  const guidesCollectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Guides Vendeurs Immobilier Gironde",
    "description": "Collection de guides spécialisés pour vendeurs immobiliers en Gironde selon votre profil et situation de vente",
    "url": "https://estimation-immobilier-gironde.fr/guides",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": guides.length,
      "itemListElement": guides.map((guide, index) => ({
        "@type": "CreativeWork",
        "position": index + 1,
        "name": guide.title,
        "description": guide.summary || guide.metaDescription,
        "author": {
          "@type": "Organization",
          "name": "Estimation Immobilière Gironde"
        },
        "genre": "Guide immobilier",
        "audience": {
          "@type": "Audience",
          "audienceType": GUIDE_PERSONAS[guide.persona as keyof typeof GUIDE_PERSONAS]
        },
        "url": `https://estimation-immobilier-gironde.fr/guides/${guide.slug}`
      }))
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": "https://estimation-immobilier-gironde.fr"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Guides Vendeurs",
          "item": "https://estimation-immobilier-gironde.fr/guides"
        }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Guides Vendeurs Immobilier Gironde | Conseils Experts Vente 2025"
        description="📚 Guides spécialisés pour vendre votre bien en Gironde selon votre profil. Conseils experts, stratégies personnalisées, PDF gratuits. 6 situations couvertes."
        keywords={[
          'guide vendeur Gironde',
          'vendre maison Bordeaux',
          'conseils vente immobilière Gironde',
          'guide immobilier gratuit',
          'vente immobilière Bordeaux',
          'expert vente Gironde',
          'conseil vendeur immobilier',
          'guide PDF immobilier',
          'stratégie vente maison',
          'aide vendeur Gironde'
        ]}
        canonical="https://estimation-immobilier-gironde.fr/guides"
        openGraph={{
          title: "Guides Vendeurs Immobilier Gironde | Conseils Experts",
          description: "Guides spécialisés pour vendre votre bien en Gironde selon votre profil. Conseils experts et stratégies personnalisées.",
          url: "https://estimation-immobilier-gironde.fr/guides",
          type: "website"
        }}
        twitterCard={{
          card: "summary_large_image",
          title: "Guides Vendeurs Immobilier Gironde",
          description: "Guides spécialisés pour vendre selon votre profil en Gironde. Conseils experts gratuits."
        }}
        structuredData={guidesCollectionSchema}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6" data-testid="heading-guides">
              Guides Vendeurs Gironde
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Des guides personnalisés selon votre situation pour vendre au meilleur prix et dans les meilleures conditions en Gironde.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>6 profils vendeurs</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>15-30 min de lecture</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Format PDF inclus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Stats */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Trouvez votre guide</h2>
              <p className="text-muted-foreground">
                Chaque situation de vente est unique. Sélectionnez le profil qui vous correspond.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                  <SelectTrigger className="w-48" data-testid="select-persona">
                    <SelectValue placeholder="Tous les profils" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les profils</SelectItem>
                    {Object.entries(GUIDE_PERSONAS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {guides.length} guide{guides.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Persona Overview */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {personaStats.map(persona => (
              <Card 
                key={persona.key}
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedPersona === persona.key ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedPersona(selectedPersona === persona.key ? '' : persona.key)}
                data-testid={`card-persona-${persona.key}`}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {persona.count}
                  </div>
                  <div className="text-sm font-medium">
                    {persona.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4 mb-16">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded mb-4"></div>
                    <div className="flex gap-2 mb-2">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : guides.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  {selectedPersona ? 'Aucun guide pour ce profil' : 'Aucun guide disponible'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {selectedPersona 
                    ? 'Essayez de sélectionner un autre profil ou consultez tous les guides.'
                    : 'Les guides seront bientôt disponibles. Revenez consulter cette page.'
                  }
                </p>
                {selectedPersona && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedPersona('')}
                    data-testid="button-view-all"
                  >
                    Voir tous les guides
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map(guide => (
                <Card key={guide.id} className="flex flex-col hover-elevate" data-testid={`card-guide-${guide.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {GUIDE_PERSONAS[guide.persona as keyof typeof GUIDE_PERSONAS]}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {guide.readingTime} min
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight" data-testid={`title-${guide.id}`}>
                      {guide.title}
                    </CardTitle>
                    <CardDescription className="text-sm" data-testid={`benefit-${guide.id}`}>
                      {guide.shortBenefit}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    {guide.summary && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Au programme :</strong>
                        <p className="mt-1">{guide.summary}</p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-4">
                    <Button 
                      asChild 
                      className="w-full group" 
                      data-testid={`button-download-${guide.id}`}
                    >
                      <Link href={`/guide/${guide.slug}`}>
                        Télécharger le guide
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Besoin d'un accompagnement personnalisé ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Nos experts en immobilier Gironde vous accompagnent pour une estimation gratuite et des conseils sur-mesure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" data-testid="button-estimation">
                <Link href="/estimation">
                  Estimation gratuite
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" data-testid="button-contact">
                <Link href="/contact">
                  Nous contacter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}