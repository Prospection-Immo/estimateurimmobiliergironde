import { useState, useEffect } from 'react';
import { X, FileText, Home, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

interface Guide {
  id: string;
  title: string;
  slug: string;
  persona: string;
  benefit: string;
  readingTime: string;
}

interface ArticleFloatingWidgetProps {
  articleSlug: string;
  articleCategory?: string;
  articleTitle?: string;
}

export default function ArticleFloatingWidget({ 
  articleSlug, 
  articleCategory = 'conseils',
  articleTitle = ''
}: ArticleFloatingWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show widget after 5 seconds of reading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDismissed) {
        setIsVisible(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isDismissed]);

  // Get related guide based on article category/content
  const { data: relatedGuide } = useQuery<Guide | null>({
    queryKey: ['/api/guides', 'related', articleCategory],
    queryFn: async () => {
      try {
        const response = await fetch('/api/guides');
        if (!response.ok) return null;
        
        const guides: Guide[] = await response.json();
        
        // Logic to find related guide based on article category/title
        let relatedGuide = null;
        
        if (articleTitle.toLowerCase().includes('vente') || articleCategory === 'conseils') {
          // For sales/advice articles, suggest guides for different personas
          if (articleTitle.toLowerCase().includes('rapide') || articleTitle.toLowerCase().includes('urgent')) {
            relatedGuide = guides.find(g => g.persona === 'presse');
          } else if (articleTitle.toLowerCase().includes('prix') || articleTitle.toLowerCase().includes('valeur')) {
            relatedGuide = guides.find(g => g.persona === 'maximisateur');
          } else if (articleTitle.toLowerCase().includes('succession') || articleTitle.toLowerCase().includes('héritage')) {
            relatedGuide = guides.find(g => g.persona === 'succession');
          } else if (articleTitle.toLowerCase().includes('investissement')) {
            relatedGuide = guides.find(g => g.persona === 'investisseur');
          } else if (articleTitle.toLowerCase().includes('première') || articleTitle.toLowerCase().includes('premier')) {
            relatedGuide = guides.find(g => g.persona === 'primo');
          } else {
            relatedGuide = guides.find(g => g.persona === 'nouvelle_vie');
          }
        } else if (articleCategory === 'marche') {
          relatedGuide = guides.find(g => g.persona === 'maximisateur');
        } else if (articleCategory === 'estimation') {
          relatedGuide = guides.find(g => g.persona === 'presse');
        }
        
        // Fallback to first available guide
        return relatedGuide || guides[0] || null;
      } catch {
        return null;
      }
    },
    enabled: isVisible
  });

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Remember dismissal in localStorage for this session
    sessionStorage.setItem(`widget-dismissed-${articleSlug}`, 'true');
  };

  // Check if already dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem(`widget-dismissed-${articleSlug}`);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, [articleSlug]);

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <Card className="p-4 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-muted hover:bg-muted/80 rounded-full p-1 shadow-md hover-elevate"
          data-testid="button-close-widget"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-1">
              Besoin d'aide ?
            </h3>
            <p className="text-sm text-muted-foreground">
              Choisissez votre prochaine étape
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Related Guide */}
            {relatedGuide && (
              <Link 
                href={`/guides/${relatedGuide.slug}`}
                className="block"
                data-testid="link-related-guide"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 border hover-elevate cursor-pointer transition-colors">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {relatedGuide.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Guide gratuit • {relatedGuide.readingTime}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            )}

            {/* Quick Estimation */}
            <Link 
              href="/estimation"
              className="block"
              data-testid="link-estimation"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 hover:bg-green-500/10 border hover-elevate cursor-pointer transition-colors">
                <div className="bg-green-500/10 p-2 rounded-lg flex-shrink-0">
                  <Home className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">
                    Estimation gratuite
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Évaluez votre bien en 3 minutes
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>

            {/* Contact for Questions */}
            <Link 
              href="/contact"
              className="block"
              data-testid="link-contact"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/5 hover:bg-orange-500/10 border hover-elevate cursor-pointer transition-colors">
                <div className="bg-orange-500/10 p-2 rounded-lg flex-shrink-0">
                  <Phone className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">
                    Prendre RDV
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Posez vos questions à un expert
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              ✨ Services 100% gratuits
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}