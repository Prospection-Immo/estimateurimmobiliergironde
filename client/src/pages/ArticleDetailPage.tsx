import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, ArrowLeft, User, Clock } from "lucide-react";
import { useEffect } from "react";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  seoTitle?: string;
  category?: string;
  publishedAt?: string;
  authorName?: string;
  keywords?: string;
}

interface ArticleDetailPageProps {
  domain?: string;
}

export default function ArticleDetailPage({ domain = "estimation-immobilier-gironde.fr" }: ArticleDetailPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const isGironde = domain.includes("gironde");
  const cityName = isGironde ? "Gironde" : "Bordeaux";

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['/api/articles', slug],
    queryFn: async () => {
      const response = await fetch(`/api/articles/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Article not found');
        }
        throw new Error('Failed to fetch article');
      }
      return response.json() as Promise<Article>;
    },
    enabled: !!slug
  });

  useEffect(() => {
    if (article) {
      document.title = article.seoTitle || article.title || `Votre guide gratuit - Estimation ${cityName}`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && article.metaDescription) {
        metaDescription.setAttribute('content', article.metaDescription);
      }

      // Update Open Graph tags if they exist
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', article.title);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription && article.metaDescription) {
        ogDescription.setAttribute('content', article.metaDescription);
      }
    }
  }, [article, cityName]);

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

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const textLength = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(textLength / wordsPerMinute);
    return `${minutes} min de lecture`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-foreground">
              Article non trouvé
            </h1>
            <p className="text-lg text-muted-foreground">
              Cet article n'existe pas ou a été supprimé.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/actualites">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux actualités
                </Button>
              </Link>
              <Link href="/">
                <Button>
                  Accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/actualites">
            <Button variant="ghost" size="sm" data-testid="button-back-articles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux actualités
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <article className="space-y-8">
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" data-testid={`badge-category-${article.category}`}>
                {getCategoryLabel(article.category)}
              </Badge>
              {article.publishedAt && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(article.publishedAt)}
                </div>
              )}
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {getReadingTime(article.content)}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight" data-testid="title-article">
              {article.title}
            </h1>

            {article.metaDescription && (
              <p className="text-lg text-muted-foreground leading-relaxed" data-testid="text-article-description">
                {article.metaDescription}
              </p>
            )}

            <div className="flex items-center gap-4 pt-4">
              {article.authorName && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-2" />
                  <span data-testid="text-article-author">Par {article.authorName}</span>
                </div>
              )}
            </div>

            <Separator />
          </header>

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary prose-a:text-primary hover:prose-a:text-primary/80 prose-table:text-foreground prose-th:text-foreground prose-td:text-foreground"
            dangerouslySetInnerHTML={{ __html: article.content }}
            data-testid="content-article"
          />

          {/* Article Footer */}
          <footer className="pt-8 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Article publié le {formatDate(article.publishedAt)}
                {article.authorName && ` par ${article.authorName}`}
              </div>
              
              <div className="flex gap-2">
                <Link href="/estimation">
                  <Button size="sm" data-testid="button-get-estimation">
                    Obtenir une estimation
                  </Button>
                </Link>
                <Link href="/actualites">
                  <Button variant="outline" size="sm" data-testid="button-more-articles">
                    Plus d'articles
                  </Button>
                </Link>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}