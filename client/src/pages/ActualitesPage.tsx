import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, FileText } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

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

  useEffect(() => {
    document.title = `Actualités immobilières ${cityName} - Estimation Gironde`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `Découvrez nos derniers articles et conseils sur l'immobilier en ${cityName}. Analyses de marché, tendances et guides pratiques.`);
    }
  }, [cityName]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Actualités de l'immobilier en Gironde : marché, tendances et conseils
              </h1>
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-48">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Actualités de l'immobilier en Gironde : marché, tendances et conseils
            </h1>
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <p>Erreur lors du chargement des articles. Veuillez réessayer plus tard.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground" data-testid="title-actualites">
              Actualités de l'immobilier en Gironde : marché, tendances et conseils
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez nos derniers articles, analyses de marché et conseils d'experts 
              pour réussir vos projets immobiliers en {cityName}.
            </p>
          </div>

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
    </div>
  );
}