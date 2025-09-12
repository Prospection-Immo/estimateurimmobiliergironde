import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Clock, 
  Download, 
  User, 
  CheckCircle, 
  ArrowLeft, 
  FileText, 
  Shield,
  Star,
  Users,
  Target
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { type Guide, GUIDE_PERSONAS } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Form validation schema
const guideLeadSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  acceptTerms: z.boolean().refine(val => val === true, "Vous devez accepter les conditions"),
  guideSlug: z.string()
});

type GuideLeadForm = z.infer<typeof guideLeadSchema>;

// Utility function to detect domain from Host header
function getDomainFromHeaders(): string {
  return "estimation-immobilier-gironde.fr";
}

// Table of contents component
function TableOfContents({ content }: { content: string }) {
  const [activeSection, setActiveSection] = useState<string>("");

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

  // Scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Sommaire</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => scrollToSection(heading.id)}
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

// Lead capture form component
function LeadCaptureForm({ guide }: { guide: Guide }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<GuideLeadForm>({
    resolver: zodResolver(guideLeadSchema),
    defaultValues: {
      firstName: "",
      email: "",
      city: "",
      acceptTerms: false,
      guideSlug: guide.slug
    }
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: GuideLeadForm) => {
      return apiRequest('POST', '/api/guide-leads', {
        firstName: data.firstName,
        email: data.email,
        city: data.city,
        guideSlug: data.guideSlug,
        acceptTerms: data.acceptTerms,
        source: 'website'
      });
    },
    onSuccess: (response, variables) => {
      // Store lead context in localStorage with secure token (RGPD-compliant)
      const leadContext = {
        firstName: variables.firstName,
        email: variables.email,
        city: variables.city,
        guideSlug: variables.guideSlug,
        token: (response as any).leadToken // Secure token from backend
      };
      
      localStorage.setItem('guide-lead-context', JSON.stringify(leadContext));
      
      // Redirect to thank you page WITHOUT query parameters (secure)
      setLocation(`/guides/${guide.slug}/merci`);
      
      toast({
        title: "Guide envoyé !",
        description: "Redirection vers votre guide...",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/guides'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: GuideLeadForm) => {
    createLeadMutation.mutate(data);
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-xl">Téléchargez ce guide gratuit</CardTitle>
        <CardDescription>
          Accédez instantanément au guide PDF complet avec exemples et checklists exclusives.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Votre prénom" 
                      {...field} 
                      data-testid="input-firstname"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="votre@email.com" 
                      {...field} 
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Bordeaux" 
                      {...field} 
                      data-testid="input-city"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-terms"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm">
                      J'accepte de recevoir ce guide et les conseils par email *
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Conforme RGPD. Désabonnement possible à tout moment.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createLeadMutation.isPending}
              data-testid="button-download-guide"
            >
              {createLeadMutation.isPending ? (
                "Envoi en cours..."
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le guide gratuit
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Social proof */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            "Conseils très utiles et applicables immédiatement"
            <br />
            <span className="font-medium">Marie D., Bordeaux</span>
          </p>
        </div>

        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>100% gratuit • Sans engagement</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GuideDetailPage() {
  const domain = getDomainFromHeaders();
  const [match, params] = useRoute("/guides/:slug");
  const slug = match ? params?.slug : undefined;

  // Fetch guide data from API
  const { data: guide, isLoading, error } = useQuery<Guide>({
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

  // Add IDs to headings for table of contents
  const processContentWithIds = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    
    headings.forEach((heading, index) => {
      heading.id = `section-${index}`;
    });
    
    return doc.body.innerHTML;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header domain={domain} />
        <main className="py-8">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-64 mb-8"></div>
              <div className="grid lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-4">
                  <div className="h-12 bg-muted rounded"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-4 bg-muted rounded"></div>
                    ))}
                  </div>
                </div>
                <div className="h-96 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer domain={domain} />
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-background">
        <Header domain={domain} />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">Guide non trouvé</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Le guide que vous recherchez n'existe pas ou a été déplacé.
              </p>
              <Button asChild data-testid="button-back-guides">
                <Link href="/guides">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux guides
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer domain={domain} />
      </div>
    );
  }

  const processedContent = processContentWithIds(guide.content);

  return (
    <div className="min-h-screen bg-background">
      <Header domain={domain} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link 
              href="/guides" 
              className="inline-flex items-center text-primary hover:underline mb-6"
              data-testid="link-back-guides"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux guides
            </Link>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <Badge className="mb-4" data-testid="badge-persona">
                  {GUIDE_PERSONAS[guide.persona as keyof typeof GUIDE_PERSONAS]}
                </Badge>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="title-guide">
                  {guide.title}
                </h1>
                
                <p className="text-lg text-muted-foreground mb-6" data-testid="text-benefit">
                  {guide.shortBenefit}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{guide.readingTime} min de lecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Format PDF inclus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Guide spécialisé</span>
                  </div>
                </div>
              </div>
              
              {/* Quick CTA for mobile */}
              <div className="lg:hidden">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm font-medium mb-3">Téléchargement gratuit</p>
                    <Button asChild className="w-full">
                      <a href="#lead-form">
                        <Download className="w-4 h-4 mr-2" />
                        Obtenir le guide
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Content Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Summary */}
              {guide.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Ce que vous allez apprendre
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{guide.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Table of Contents - Desktop only */}
              <div className="hidden lg:block">
                <TableOfContents content={guide.content} />
              </div>

              {/* Guide Content */}
              <Card>
                <CardContent className="p-8">
                  <div 
                    className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                    data-testid="guide-content"
                  />
                </CardContent>
              </Card>

              {/* Bottom CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-4">
                    Vous avez trouvé ce guide utile ?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Obtenez une estimation personnalisée gratuite de votre bien en Gironde. 
                    Notre équipe d'experts vous accompagne dans votre projet immobilier.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" data-testid="button-estimate-bottom">
                      <Link href="/estimation">Estimation gratuite</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" data-testid="button-contact-bottom">
                      <Link href="/contact">Parler à un expert</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1" id="lead-form">
              <LeadCaptureForm guide={guide} />
            </div>
          </div>
        </div>
      </main>

      <Footer domain={domain} />
    </div>
  );
}