// Formation checkout page - Based on javascript_stripe integration
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, Shield, Clock } from "lucide-react";
import { coursesContent } from "@shared/content/courses";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const CheckoutForm = ({ course }: { course: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/formation/${course.slug}/merci`,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Erreur de paiement",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Paiement réussi !",
        description: "Vous allez recevoir votre formation par email.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
        data-testid="button-complete-payment"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Traitement en cours...
          </>
        ) : (
          `Payer ${course.priceEuros}€`
        )}
      </Button>
    </form>
  );
};

export default function CheckoutPage() {
  const { slug } = useParams();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Find course by slug
  const course = Object.values(coursesContent).find(c => c.slug === slug);

  useEffect(() => {
    if (!course) return;

    // Create PaymentIntent for this specific course
    // Backend will validate price server-side for security
    apiRequest("/api/create-payment-intent", {
      method: "POST",
      body: { 
        courseSlug: course.slug
      }
    })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Payment intent creation failed:', err);
        setError("Impossible de créer la session de paiement. Veuillez réessayer.");
        setLoading(false);
      });
  }, [course]);

  if (!course) {
    return <NotFound />;
  }

  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Configuration de paiement en cours...
              </p>
              <Link href={`/formation/${course.slug}`}>
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la formation
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`Commande ${course.title} - ${course.priceEuros}€ | Formation Immobilière`}
        description={`Finalisez votre achat de la formation "${course.title}" pour ${course.priceEuros}€. Paiement sécurisé par Stripe.`}
        canonical={`https://estimation-immobilier-gironde.fr/checkout/${course.slug}`}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <Link href={`/formation/${course.slug}`}>
              <Button variant="ghost" className="mb-4" data-testid="button-back-to-course">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la formation
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-center mb-2" data-testid="text-checkout-title">
              Finaliser votre commande
            </h1>
            <p className="text-center text-muted-foreground">
              Paiement sécurisé par Stripe
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8">
            {/* Course Summary */}
            <div>
              <Card data-testid="card-order-summary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Résumé de votre commande
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold" data-testid="text-course-title">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {course.subtitle}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        Formation Premium
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary" data-testid="text-course-price">
                        {course.priceEuros}€
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      {course.sections.deliverables.items.slice(0, 3).map((deliverable: string, index: number) => (
                        <div key={index} className="flex items-start gap-2" data-testid={`deliverable-${index}`}>
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{deliverable}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>Satisfait ou remboursé sous 7 jours</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Accès immédiat après paiement</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span className="text-xl text-primary">{course.priceEuros}€</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div>
              <Card data-testid="card-payment-form">
                <CardHeader>
                  <CardTitle>Informations de paiement</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                      <span className="ml-2">Initialisation du paiement...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-4">{error}</p>
                      <Button onClick={() => window.location.reload()}>
                        Réessayer
                      </Button>
                    </div>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ 
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                      }
                    }}>
                      <CheckoutForm course={course} />
                    </Elements>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Chargement du formulaire de paiement...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}