import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { 
  CheckCircle, 
  Download, 
  BookOpen, 
  Star,
  Users,
  Clock,
  ArrowRight,
  Shield,
  Gift,
  MessageCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { type Guide, GUIDE_PERSONAS } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLeadContext } from "@/lib/leadContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Utility function to detect domain from Host header
function getDomainFromHeaders(): string {
  return "estimation-immobilier-gironde.fr";
}


// Guide thanks page component
export default function GuideThanksPage() {
  const domain = getDomainFromHeaders();
  const [, params] = useRoute("/guides/:slug/merci");
  const { leadContext, isLoading: leadContextLoading } = useLeadContext();
  const { toast } = useToast();
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const slug = params?.slug;

  // Fetch guide data
  const { data: guide, isLoading } = useQuery<Guide>({
    queryKey: ['/api/guides', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      const response = await fetch(`/api/guides/${slug}`);
      if (!response.ok) {
        throw new Error('Guide not found');
      }
      return response.json();
    },
    enabled: !!slug
  });

  // Track analytics with secure lead context
  const trackAnalyticsMutation = useMutation({
    mutationFn: async (eventData: {
      guideId: string;
      eventType: string;
      eventValue?: string;
    }) => {
      if (!leadContext?.email) {
        console.error('No lead context available for analytics');
        return;
      }

      return apiRequest('POST', '/api/guides/analytics', {
        guideId: eventData.guideId,
        sessionId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        leadEmail: leadContext.email,
        eventType: eventData.eventType,
        eventValue: eventData.eventValue,
        userAgent: navigator.userAgent,
        ipAddress: '' // Will be filled by backend
      });
    },
    onError: (error) => {
      console.error('Analytics tracking failed:', error);
    }
  });

  // Track page view on mount
  useEffect(() => {
    if (guide && !hasTrackedView && leadContext?.email) {
      trackAnalyticsMutation.mutate({
        guideId: guide.id,
        eventType: 'thank_you_page_view'
      });
      setHasTrackedView(true);
    }
  }, [guide, hasTrackedView, leadContext]);

  // Handle PDF download with secure token system
  const handlePdfDownload = () => {
    if (!guide || !leadContext) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le PDF. Veuillez rafraîchir la page.",
        variant: "destructive"
      });
      return;
    }
    
    // Track intent
    trackAnalyticsMutation.mutate({
      guideId: guide.id,
      eventType: 'pdf_download_click'
    });

    if (leadContext.token) {
      // Use secure token system (RGPD-compliant)
      window.open(`/api/guides/${slug}/download-pdf?token=${encodeURIComponent(leadContext.token)}`, '_blank');
    } else {
      toast({
        title: "Erreur",
        description: "Token de sécurité manquant. Veuillez recommencer le processus.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Téléchargement démarré",
      description: "Votre guide PDF va se télécharger automatiquement.",
    });
  };

  // Handle online reading
  const handleOnlineReading = () => {
    if (!guide) return;
    
    // Track intent
    trackAnalyticsMutation.mutate({
      guideId: guide.id,
      eventType: 'online_reading_click'
    });
  };

  // Redirect if no lead context (user didn't go through proper flow)
  useEffect(() => {
    if (!leadContextLoading && !leadContext) {
      toast({
        title: "Accès non autorisé",
        description: "Vous devez d'abord demander le guide pour accéder à cette page.",
        variant: "destructive"
      });
      // Redirect to guides page after a short delay
      setTimeout(() => {
        window.location.href = '/guides';
      }, 2000);
    }
  }, [leadContext, leadContextLoading, toast]);

  if (isLoading || leadContextLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header domain={domain} />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer domain={domain} />
      </div>
    );
  }

  // Show error if no lead context
  if (!leadContextLoading && !leadContext) {
    return (
      <div className="min-h-screen bg-background">
        <Header domain={domain} />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-destructive mb-4">Accès non autorisé</h1>
              <p className="text-muted-foreground mb-6">
                Vous devez d'abord demander le guide pour accéder à cette page.
              </p>
              <Button asChild>
                <Link href="/guides">Voir tous les guides</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer domain={domain} />
      </div>
    );
  }

  if (!guide || !slug) {
    return (
      <div className="min-h-screen bg-background">
        <Header domain={domain} />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-destructive mb-4">Guide non trouvé</h1>
              <p className="text-muted-foreground mb-6">
                Le guide demandé n'existe pas ou n'est plus disponible.
              </p>
              <Button asChild>
                <Link href="/guides">Voir tous les guides</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer domain={domain} />
      </div>
    );
  }

  const personaLabel = GUIDE_PERSONAS[guide.persona as keyof typeof GUIDE_PERSONAS];

  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      
      <main>
        {/* Hero Section - Thank You */}
        <section className="py-16 bg-gradient-to-br from-green-50 via-background to-primary/5 dark:from-green-950/20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              {/* Success Icon */}
              <div className="mb-6">
                <div className="bg-green-500/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>
              
              {/* Thank you message */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="heading-thanks">
                Merci {leadContext?.firstName || 'cher utilisateur'} !
              </h1>
              
              <p className="text-xl text-muted-foreground mb-2">
                Votre guide est maintenant disponible
              </p>
              
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Nous avons également envoyé une copie à <strong>{leadContext?.email || 'votre adresse email'}</strong> pour que vous puissiez y accéder à tout moment.
              </p>
              
              {/* Guide Preview Card */}
              <Card className="text-left max-w-2xl mx-auto mb-8">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2" data-testid="badge-persona">
                        {personaLabel}
                      </Badge>
                      <CardTitle className="text-xl mb-2" data-testid="text-guide-title">
                        {guide.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {guide.shortBenefit}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        <span>{guide.readingTime} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        <span>Exclusif</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <Separator />
                
                <CardContent className="pt-6">
                  {/* Action Buttons */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Button 
                      asChild 
                      size="lg" 
                      className="h-12"
                      onClick={handleOnlineReading}
                      data-testid="button-read-online"
                    >
                      <Link href={`/guides/${slug}/lire`}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Lire en ligne
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="h-12"
                      onClick={handlePdfDownload}
                      data-testid="button-download-pdf"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger PDF
                    </Button>
                  </div>
                  
                  {/* Value proposition */}
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Contenu exclusif et personnalisé
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ce guide contient des stratégies éprouvées et des exemples concrets pour votre profil de vendeur en Gironde.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8">
                Déjà plus de 1,200+ vendeurs nous font confiance
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="text-center p-6">
                  <div className="flex justify-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    "Grâce à ce guide, j'ai vendu 15% au-dessus du prix initial proposé par mon agent !"
                  </p>
                  <p className="text-xs font-medium">
                    Marie L. - Bordeaux
                  </p>
                </Card>
                
                <Card className="text-center p-6">
                  <div className="flex justify-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    "Enfin des conseils pratiques et adaptés à la réalité du marché girondin !"
                  </p>
                  <p className="text-xs font-medium">
                    Jean-Paul M. - Mérignac
                  </p>
                </Card>
                
                <Card className="text-center p-6">
                  <div className="flex justify-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    "J'ai évité de nombreuses erreurs coûteuses grâce à ce guide complet."
                  </p>
                  <p className="text-xs font-medium">
                    Sophie D. - Pessac
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Other Guides CTA */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  Découvrez nos autres guides spécialisés
                </h2>
                <p className="text-muted-foreground">
                  Chaque situation de vente nécessite une approche personnalisée
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild variant="outline" size="lg">
                  <Link href="/guides">
                    <Users className="w-4 h-4 mr-2" />
                    Voir tous les guides
                  </Link>
                </Button>
                
                <Button asChild size="lg">
                  <Link href="/estimation">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Estimer mon bien gratuitement
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <MessageCircle className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Une question sur ce guide ?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Notre expert immobilier est là pour vous accompagner dans votre projet de vente en Gironde.
                </p>
                <Button asChild variant="outline">
                  <Link href="/contact">
                    Contacter notre expert
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer domain={domain} />
    </div>
  );
}