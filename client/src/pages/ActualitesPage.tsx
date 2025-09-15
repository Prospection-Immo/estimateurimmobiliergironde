import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, FileText } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";
import SEOHead from "@/components/SEOHead";

interface Article {
  id: string;
  title: string;
  slug: string;
  metaDescription?: string;
  summary?: string;
  category?: string;
  publishedAt?: string;
  authorName?: string;
}

interface ActualitesPageProps {
  domain?: string;
}

export default function ActualitesPage({ domain = "estimation-immobilier-gironde.fr" }: ActualitesPageProps) {
  const isGironde = domain.includes("gironde");
  const cityName = isGironde ? "Gironde" : "Bordeaux";

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['/api/articles'],
    queryFn: async () => {
      const response = await fetch('/api/articles');
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      return response.json() as Promise<Article[]>;
    }
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      'estimation': 'Estimation',
      'marche': 'Marché',
      'conseils': 'Conseils',
      'investissement': 'Investissement',
      'juridique': 'Juridique'
    };
    return labels[category || ''] || 'Article';
  };

  // Structured data for blog/articles
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": `Actualités Immobilières ${cityName}`,
    "description": `Blog d'actualités et conseils immobiliers en ${cityName}. Analyses de marché, tendances, guides pratiques et conseils d'experts.`,
    "url": `https://${domain}/actualites`,
    "publisher": {
      "@type": "Organization",
      "name": "Estimation Immobilière Gironde"
    },
    "blogPost": (articles || []).map(article => ({
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.metaDescription || article.summary,
      "url": `https://${domain}/articles/${article.slug}`,
      "datePublished": article.publishedAt,
      "author": {
        "@type": "Person",
        "name": article.authorName || "Expert Immobilier Gironde"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Estimation Immobilière Gironde"
      }
    }))
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative min-h-[50vh] bg-gradient-to-br from-background to-muted flex items-center">
          {/* Hero Background */}
          <div className="absolute inset-0 z-0">
            <img
              src={bordeaux_house}
              alt="Actualités immobilières Gironde - Marché et tendances Bordeaux"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
            {/* Centered Title */}
            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Actualités immobilières Gironde
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mt-3">
                Marché, tendances et conseils
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-base sm:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
                Découvrez nos derniers articles, analyses de marché et conseils d'experts 
                pour réussir vos projets immobiliers en {cityName}.
              </p>
            </div>
          </div>
        </section>

        {/* Loading Content */}
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-64">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative min-h-[50vh] bg-gradient-to-br from-background to-muted flex items-center">
          {/* Hero Background */}
          <div className="absolute inset-0 z-0">
            <img
              src={bordeaux_house}
              alt="Actualités immobilières Gironde - Marché et tendances Bordeaux"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
            {/* Centered Title */}
            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Actualités immobilières Gironde
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mt-3">
                Marché, tendances et conseils
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-base sm:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
                Découvrez nos derniers articles, analyses de marché et conseils d'experts 
                pour réussir vos projets immobiliers en {cityName}.
              </p>
            </div>
          </div>
        </section>

        {/* Error Content */}
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center">
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                <p>Erreur lors du chargement des articles. Veuillez réessayer plus tard.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Actualités Immobilières ${cityName} | Marché & Conseils Experts 2025`}
        description={`📰 Actualités et conseils immobiliers ${cityName}. Analyses de marché, tendances, investissement. Expert local, conseils gratuits pour réussir vos projets.`}
        keywords={[
          `actualités immobilières ${cityName}`,
          `marché immobilier ${cityName}`,
          'conseils immobilier Gironde',
          'blog immobilier Bordeaux',
          'tendances immobilières Gironde',
          'investissement immobilier Bordeaux',
          'prix immobilier Gironde',
          'expert immobilier Bordeaux',
          'guides immobiliers gratuits',
          'actualité immobilier Gironde'
        ]}
        canonical={`https://${domain}/actualites`}
        openGraph={{
          title: `Actualités Immobilières ${cityName}`,
          description: `Actualités et conseils immobiliers ${cityName}. Analyses de marché, tendances et guides pratiques par nos experts locaux.`,
          image: bordeaux_house,
          url: `https://${domain}/actualites`,
          type: "website"
        }}
        twitterCard={{
          card: "summary_large_image",
          title: `Actualités Immobilières ${cityName}`,
          description: `Actualités immobilier ${cityName}. Analyses marché, conseils experts.`,
          image: bordeaux_house
        }}
        structuredData={blogSchema}
      />
      {/* Hero Section */}
      <section className="relative min-h-[50vh] bg-gradient-to-br from-background to-muted flex items-center">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={bordeaux_house}
            alt="Belle propriété en Gironde"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
          {/* Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight" data-testid="title-actualites">
              Actualités immobilières Gironde
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mt-3">
              Marché, tendances et conseils
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-base sm:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Découvrez nos derniers articles, analyses de marché et conseils d'experts 
              pour réussir vos projets immobiliers en {cityName}.
            </p>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-8">

            {/* Articles Grid */}
            {articles && articles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Card key={article.id} className="hover-elevate" data-testid={`card-article-${article.slug}`}>
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryLabel(article.category)}
                      </Badge>
                      {article.publishedAt && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(article.publishedAt)}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight" data-testid={`text-article-title-${article.slug}`}>
                      {article.title}
                    </CardTitle>
                    {(article.summary || article.metaDescription) && (
                      <CardDescription className="text-sm">
                        {article.summary || article.metaDescription}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      {article.authorName && (
                        <span className="text-xs text-muted-foreground">
                          Par {article.authorName}
                        </span>
                      )}
                      <Link href={`/actualites/${article.slug}`}>
                        <Button variant="ghost" size="sm" data-testid={`button-read-article-${article.slug}`}>
                          Lire l'article
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            ) : (
              <div className="text-center py-16 space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                <h3 className="text-xl font-semibold text-foreground">
                  Aucun article disponible
                </h3>
                <p className="text-muted-foreground">
                  Nos experts préparent du contenu de qualité pour vous. 
                  Revenez bientôt pour découvrir nos articles !
                </p>
                <Link href="/">
                  <Button variant="outline">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}