import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Euro, Clock, Shield, ArrowLeft } from "lucide-react";
import { coursesContent } from "@shared/content/courses";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import NotFound from "@/pages/not-found";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetailPage() {
  const { slug } = useParams();
  const { toast } = useToast();
  
  // Find course by slug
  const course = Object.values(coursesContent).find(c => c.slug === slug);
  
  if (!course) {
    return <NotFound />;
  }

  const handlePurchase = () => {
    // TODO: Integrate with Stripe payment
    toast({
      title: "Formation ajoutée au panier",
      description: `"${course.title}" - ${course.priceEuros}€. Intégration de paiement en cours de développement.`,
      duration: 4000,
    });
    console.log(`Purchase course ${course.sku} for ${course.priceEuros}€`);
  };

  return (
    <>
      <SEOHead
        title={`${course.title} - ${course.priceEuros}€ | Formation Immobilière`}
        description={`${course.hero.hook} Formation pratique à ${course.priceEuros}€ pour apprendre ${course.subtitle.toLowerCase()}.`}
        canonical={`https://estimation-immobilier-gironde.fr/formation/${course.slug}`}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Back button */}
          <div className="mb-8">
            <Link href="/formations">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux formations
              </Button>
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <Badge className="mb-4 px-4 py-2" data-testid="badge-formation">
                Formation Premium
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-4" data-testid="text-course-title">
                {course.hero.h1}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto" data-testid="text-course-hook">
                {course.hero.hook}
              </p>
              
              {/* Key benefits */}
              <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
                {course.hero.bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 text-left" data-testid={`benefit-${index}`}>
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                    <span className="text-sm">{point.replace('✅ ', '')}</span>
                  </div>
                ))}
              </div>
              
              {/* Price and CTA */}
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 mb-8 border">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-1" data-testid="price-display">
                    <Euro className="w-5 h-5 text-primary" />
                    <span className="text-3xl font-bold">{course.priceEuros}</span>
                    <span className="text-lg text-muted-foreground">€</span>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="px-8 py-4 text-lg" 
                  onClick={handlePurchase}
                  data-testid="button-purchase"
                >
                  {course.cta.label}
                </Button>
                
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-cta-subtext">
                  {course.cta.subtext}
                </p>
              </div>
            </div>

            {/* What you'll learn */}
            <Card className="mb-8" data-testid="card-learning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  {course.sections.learn.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {course.sections.learn.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`learn-item-${index}`}>
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What you receive */}
            <Card className="mb-8" data-testid="card-deliverables">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {course.sections.deliverables.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {course.sections.deliverables.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`deliverable-${index}`}>
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Guarantee */}
            <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" data-testid="card-guarantee">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Garantie
                    </h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      {course.sections.guarantee}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            {course.sections.faq.length > 0 && (
              <Card className="mb-8" data-testid="card-faq">
                <CardHeader>
                  <CardTitle>Questions fréquentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {course.sections.faq.map((item, index) => (
                      <div key={index} data-testid={`faq-${index}`}>
                        <h4 className="font-semibold text-foreground mb-2">
                          {item.question}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final CTA */}
            <div className="text-center bg-background/80 backdrop-blur-sm rounded-lg p-8 border">
              <h2 className="text-2xl font-bold mb-4" data-testid="text-final-cta">
                Commencez dès maintenant
              </h2>
              <p className="text-muted-foreground mb-6">
                Rejoignez ceux qui ont pris leur vente immobilière en main
              </p>
              
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg mb-4" 
                onClick={handlePurchase}
                data-testid="button-final-purchase"
              >
                {course.cta.label}
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{course.cta.subtext}</p>
                <p className="font-medium">{course.sections.guarantee}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}