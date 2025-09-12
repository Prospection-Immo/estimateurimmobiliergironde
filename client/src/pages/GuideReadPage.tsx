import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { 
  Download, 
  Clock, 
  BookOpen,
  ArrowLeft,
  Share2,
  Star,
  Users,
  CheckCircle,
  Target,
  ArrowRight,
  Eye,
  Timer,
  BookmarkPlus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { type Guide, GUIDE_PERSONAS } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLeadContext } from "@/lib/leadContext";

// Utility function to detect domain from Host header
function getDomainFromHeaders(): string {
  return "estimation-immobilier-gironde.fr";
}


// Reading progress tracking hook
function useReadingProgress(contentRef: React.RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    const updateProgress = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const windowHeight = window.innerHeight;
      const documentHeight = element.clientHeight;
      const scrollTop = window.scrollY;
      
      const scrollProgress = (scrollTop / (documentHeight - windowHeight)) * 100;
      const clampedProgress = Math.min(Math.max(scrollProgress, 0), 100);
      setProgress(clampedProgress);
    };

    const updateTimeSpent = () => {
      setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
    };

    const handleScroll = () => updateProgress();
    const timeInterval = setInterval(updateTimeSpent, 1000);
    
    window.addEventListener('scroll', handleScroll);
    updateProgress();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timeInterval);
    };
  }, [contentRef]);

  return { progress, timeSpent };
}

// Table of contents component
function TableOfContents({ content, activeSection, onSectionClick }: { 
  content: string;
  activeSection?: string;
  onSectionClick: (id: string) => void;
}) {
  // Extract headings from HTML content
  const getHeadings = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    
    return Array.from(headings).map((heading, index) => ({
      id: `section-${index}`,
      text: heading.textContent || '',
      level: parseInt(heading.tagName.charAt(1))
    }));
  };

  const headings = getHeadings(content);

  if (headings.length === 0) return null;

  return (
    <Card className="sticky top-20 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Sommaire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => onSectionClick(heading.id)}
            className={`block w-full text-left text-sm px-3 py-2 rounded-md transition-colors hover-elevate ${
              activeSection === heading.id 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-muted-foreground hover:text-foreground'
            } ${heading.level === 3 ? 'ml-4' : ''}`}
            data-testid={`toc-${heading.id}`}
          >
            {heading.text}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

// Reading statistics component
function ReadingStats({ progress, timeSpent, estimatedTime }: {
  progress: number;
  timeSpent: number;
  estimatedTime: number;
}) {
  const remainingTime = Math.max(0, estimatedTime - Math.floor(timeSpent / 60));
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>Progression de lecture</span>
          </div>
          <div className="text-sm font-medium">
            {Math.round(progress)}%
          </div>
        </div>
        
        <Progress value={progress} className="h-2 mb-3" />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            <span>{Math.floor(timeSpent / 60)} min lues</span>
          </div>
          <div>
            {remainingTime > 0 ? `≈ ${remainingTime} min restantes` : "Lecture terminée !"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


// Process content to add section IDs for table of contents
function renderContentWithSections(content: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const headings = doc.querySelectorAll('h2, h3');
  
  headings.forEach((heading, index) => {
    heading.id = `section-${index}`;
  });
  
  return doc.body.innerHTML;
}

// Guide reading page component
export default function GuideReadPage() {
  const domain = getDomainFromHeaders();
  const [, params] = useRoute("/guides/:slug/lire");
  const { leadContext, isLoading: leadContextLoading } = useLeadContext();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState<string>("");
  const [hasTrackedMilestones, setHasTrackedMilestones] = useState({
    started: false,
    scroll25: false,
    scroll50: false,
    scroll75: false,
    scroll90: false,
    time30s: false,
    time120s: false,
  });
  
  const contentRef = useRef<HTMLDivElement>(null);
  const { progress, timeSpent } = useReadingProgress(contentRef);

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
        ipAddress: ''
      });
    },
    onError: (error) => {
      console.error('Analytics tracking failed:', error);
    }
  });

  // Track reading milestones
  useEffect(() => {
    if (!guide) return;

    const milestones = [
      { key: 'started', condition: true, event: 'reading_started' },
      { key: 'scroll25', condition: progress >= 25, event: 'scroll_25', value: '25%' },
      { key: 'scroll50', condition: progress >= 50, event: 'scroll_50', value: '50%' },
      { key: 'scroll75', condition: progress >= 75, event: 'scroll_75', value: '75%' },
      { key: 'scroll90', condition: progress >= 90, event: 'scroll_90', value: '90%' },
      { key: 'time30s', condition: timeSpent >= 30, event: 'time_30s', value: '30s' },
      { key: 'time120s', condition: timeSpent >= 120, event: 'time_120s', value: '2min' },
    ];

    milestones.forEach(milestone => {
      const key = milestone.key as keyof typeof hasTrackedMilestones;
      if (milestone.condition && !hasTrackedMilestones[key]) {
        trackAnalyticsMutation.mutate({
          guideId: guide.id,
          eventType: milestone.event,
          eventValue: milestone.value
        });
        
        setHasTrackedMilestones(prev => ({
          ...prev,
          [key]: true
        }));
      }
    });
  }, [guide, progress, timeSpent, hasTrackedMilestones]);

  // Handle section navigation
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // Account for sticky header
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

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
    
    trackAnalyticsMutation.mutate({
      guideId: guide.id,
      eventType: 'pdf_download_from_reader'
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

  // Render HTML content with section IDs
  const renderContentWithSections = (htmlContent: string) => {
    let sectionIndex = 0;
    return htmlContent.replace(/<(h[2-3])([^>]*)>/g, (match, tag, attributes) => {
      return `<${tag} id="section-${sectionIndex++}" ${attributes}>`;
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
      <>
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Show error if no lead context
  if (!leadContextLoading && !leadContext) {
    return (
      <>
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
      </>
    );
  }

  if (!guide || !slug) {
    return (
      <>
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
      </>
    );
  }

  const personaLabel = GUIDE_PERSONAS[guide.persona as keyof typeof GUIDE_PERSONAS];

  return (
    <>
      
      <main>
        {/* Header Section */}
        <section className="py-8 bg-muted/20 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Navigation */}
              <div className="flex items-center gap-4 mb-6">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/guides/${slug}/merci`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Link>
                </Button>
                
                <div className="flex-1" />
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePdfDownload}
                  data-testid="button-download-pdf"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
              
              {/* Guide Header */}
              <div className="mb-6">
                <Badge variant="outline" className="mb-3" data-testid="badge-persona">
                  {personaLabel}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="heading-guide-title">
                  {guide.title}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">
                  {guide.shortBenefit}
                </p>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{guide.readingTime} min de lecture</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Lecture en ligne</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>Guide personnalisé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <ReadingStats 
                    progress={progress}
                    timeSpent={timeSpent}
                    estimatedTime={guide.readingTime}
                  />
                  
                  <TableOfContents 
                    content={guide.content}
                    activeSection={activeSection}
                    onSectionClick={scrollToSection}
                  />
                </div>
                
                {/* Main Content */}
                <div className="lg:col-span-3">
                  <Card>
                    <CardContent className="p-8">
                      <div 
                        ref={contentRef}
                        className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground"
                        dangerouslySetInnerHTML={{ 
                          __html: renderContentWithSections(guide.content) 
                        }}
                        data-testid="content-guide"
                      />
                      
                      {/* Reading completion */}
                      {progress >= 90 && (
                        <div className="mt-8 p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                                Félicitations {leadContext?.firstName || 'cher utilisateur'} !
                              </h3>
                              <p className="text-green-800 dark:text-green-200 mb-4">
                                Vous avez terminé la lecture de ce guide. Vous possédez maintenant toutes les clés pour optimiser la vente de votre bien en Gironde.
                              </p>
                              <div className="space-y-3">
                                <Button 
                                  size="sm"
                                  onClick={handlePdfDownload}
                                  data-testid="button-download-completion"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Télécharger la version PDF complète
                                </Button>
                                <div className="flex gap-2">
                                  <Button asChild variant="outline" size="sm">
                                    <Link href="/guides">
                                      <BookmarkPlus className="w-4 h-4 mr-2" />
                                      Autres guides
                                    </Link>
                                  </Button>
                                  <Button asChild variant="outline" size="sm">
                                    <Link href="/estimation">
                                      <Target className="w-4 h-4 mr-2" />
                                      Estimer mon bien
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">
                Prêt à passer à l'action ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Vous avez maintenant tous les outils nécessaires. Commencez par obtenir une estimation gratuite et précise de votre bien.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg">
                  <Link href="/estimation">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Estimer mon bien gratuitement
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">
                    Parler à un expert
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
          </>
  );
}