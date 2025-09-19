import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Users, Clock, TrendingUp } from "lucide-react";
import { coursesContent, catalogConfig } from "@shared/content/courses";

export default function FormationsPage() {
  // Check if catalog is in coming soon mode
  if (catalogConfig.comingSoon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Badge className="mb-4 px-4 py-2 text-sm" data-testid="badge-coming-soon">
                Bientôt disponible
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-title">
                {catalogConfig.prelaunchTitle}
              </h1>
              <p className="text-xl text-muted-foreground mb-8" data-testid="text-subtitle">
                {catalogConfig.prelaunchSubtitle}
              </p>
            </div>

            <Card className="mb-12">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-6" data-testid="text-benefits-title">
                  Ce que vous apprendrez
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {catalogConfig.prelaunchBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3" data-testid={`benefit-${index}`}>
                      <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                      <span className="text-left">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button size="lg" className="px-8 py-4" data-testid="button-notify">
                {catalogConfig.prelaunchCta}
              </Button>
              <p className="text-sm text-muted-foreground">
                Soyez les premiers informés du lancement exclusif
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get available courses
  const availableCourses = Object.values(coursesContent);
  const individualCourses = availableCourses.filter(course => course.sku !== 'PACK89');
  const packCourse = availableCourses.find(course => course.sku === 'PACK89');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 px-4 py-2" data-testid="badge-premium">
            <Star className="w-4 h-4 mr-1" />
            Formations Premium
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="text-page-title">
            Devenez votre propre agent immobilier
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-page-subtitle">
            Maîtrisez toutes les étapes de la vente immobilière et économisez des milliers d'euros en frais d'agence
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2" data-testid="stat-time">
              <Clock className="w-4 h-4" />
              <span>Accès immédiat et illimité</span>
            </div>
            <div className="flex items-center gap-2" data-testid="stat-format">
              <Users className="w-4 h-4" />
              <span>Formations pour débutants</span>
            </div>
          </div>
        </div>

        {/* Pack Offer - Featured */}
        {packCourse && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="px-4 py-2 text-lg" data-testid="badge-pack-offer">
                🔥 Offre Pack - Économisez 91€
              </Badge>
            </div>
            
            <Card className="relative border-2 border-primary shadow-2xl" data-testid="card-pack-offer">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="px-4 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  MEILLEURE OFFRE
                </Badge>
              </div>
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl md:text-3xl font-bold" data-testid="text-pack-title">
                  {packCourse.title}
                </CardTitle>
                <p className="text-muted-foreground text-lg" data-testid="text-pack-subtitle">
                  {packCourse.subtitle}
                </p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <span className="text-3xl md:text-4xl font-bold text-primary" data-testid="text-pack-price">
                    {packCourse.priceEuros}€
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground line-through">488€</div>
                    <div className="text-sm font-semibold text-green-600">Économisez 91€</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {packCourse.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3" data-testid={`pack-benefit-${index}`}>
                      <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>

                {packCourse.testimonial && (
                  <div className="bg-muted p-4 rounded-lg" data-testid="testimonial-pack">
                    <p className="italic mb-2">"{packCourse.testimonial.text}"</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{packCourse.testimonial.name}</span>
                      <span className="text-xs text-green-600">{packCourse.testimonial.result}</span>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-6 flex flex-col gap-3">
                <Link href={`/formation/${packCourse.slug}`} className="w-full">
                  <Button size="lg" className="w-full text-lg py-4" data-testid="button-pack-cta">
                    {packCourse.cta.label}
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  {packCourse.cta.subtext}
                </p>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Individual Courses Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8" data-testid="text-individual-title">
            Formations individuelles
          </h2>
          
          <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {individualCourses.map((course) => (
              <Card key={course.sku} className="hover-elevate h-full flex flex-col" data-testid={`card-course-${course.sku}`}>
                <CardHeader>
                  <CardTitle className="text-xl font-bold" data-testid={`text-course-title-${course.sku}`}>
                    {course.title}
                  </CardTitle>
                  <p className="text-muted-foreground" data-testid={`text-course-subtitle-${course.sku}`}>
                    {course.subtitle}
                  </p>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-primary" data-testid={`text-course-price-${course.sku}`}>
                      {course.priceEuros}€
                    </span>
                  </div>

                  <div className="space-y-2">
                    {course.benefits.slice(0, 3).map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2" data-testid={`course-benefit-${course.sku}-${index}`}>
                        <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Link href={`/formation/${course.slug}`} className="w-full">
                    <Button variant="outline" className="w-full" data-testid={`button-course-cta-${course.sku}`}>
                      Découvrir la formation
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2" data-testid="trust-guarantee">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold">Garantie satisfaction</h3>
              <p className="text-sm text-muted-foreground">14 jours pour changer d'avis</p>
            </div>
            
            <div className="space-y-2" data-testid="trust-access">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold">Accès immédiat</h3>
              <p className="text-sm text-muted-foreground">Commencez dès maintenant</p>
            </div>
            
            <div className="space-y-2" data-testid="trust-support">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold">Accompagnement</h3>
              <p className="text-sm text-muted-foreground">Support par email inclus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}