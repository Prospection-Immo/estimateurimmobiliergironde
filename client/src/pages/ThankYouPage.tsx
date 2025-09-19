// Thank you page after successful payment
import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useStripe, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Download, Mail } from "lucide-react";
import { coursesContent } from "@shared/content/courses";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import NotFound from "@/pages/not-found";

// Make sure to call `loadStripe` outside of a component's render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// Inner component that uses Stripe hooks
const ThankYouContent = ({ slug }: { slug: string }) => {
  const stripe = useStripe();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'succeeded' | 'processing' | 'failed' | 'requires_payment_method'>('loading');
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  // Find course by slug
  const course = Object.values(coursesContent).find(c => c.slug === slug);

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');
    
    if (!clientSecret) {
      setPaymentStatus('failed');
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        setPaymentStatus('failed');
        return;
      }

      setPaymentIntent(paymentIntent);
      setPaymentStatus(paymentIntent.status as any);
    }).catch((error) => {
      console.error('Error retrieving payment intent:', error);
      setPaymentStatus('failed');
    });
  }, [stripe]);

  if (!course) {
    return <NotFound />;
  }

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'succeeded':
        return {
          title: "Paiement confirmé !",
          message: "Votre commande a été traitée avec succès.",
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          variant: "success" as const
        };
      case 'processing':
        return {
          title: "Paiement en cours...",
          message: "Votre paiement est en cours de traitement.",
          icon: <div className="w-8 h-8 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />,
          variant: "info" as const
        };
      case 'requires_payment_method':
      case 'failed':
        return {
          title: "Problème de paiement",
          message: "Le paiement n'a pas pu être traité. Veuillez réessayer.",
          icon: <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">❌</div>,
          variant: "error" as const
        };
      default:
        return {
          title: "Vérification en cours...",
          message: "Nous vérifions le statut de votre paiement.",
          icon: <div className="w-8 h-8 animate-spin border-2 border-gray-300 border-t-blue-500 rounded-full" />,
          variant: "info" as const
        };
    }
  };

  const status = getStatusMessage();

  return (
    <>
      <SEOHead
        title={`Merci pour votre commande - ${course.title} | Formation Immobilière`}
        description={`Confirmation d'achat de la formation "${course.title}". Accédez immédiatement à votre contenu de formation.`}
        canonical={`https://estimation-immobilier-gironde.fr/formation/${course.slug}/merci`}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Status Card */}
            <Card className="mb-8 text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {status.icon}
                </div>
                <CardTitle className="text-2xl" data-testid="text-payment-status-title">
                  {status.title}
                </CardTitle>
                <p className="text-muted-foreground" data-testid="text-payment-status-message">
                  {status.message}
                </p>
              </CardHeader>
              
              {paymentStatus === 'succeeded' && (
                <CardContent>
                  <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2" data-testid="text-course-title">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.subtitle}
                    </p>
                    <Badge variant="secondary" className="mb-4">
                      Formation Premium
                    </Badge>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-blue-500" />
                        <span>Vous allez recevoir un email avec les détails d'accès</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4 text-green-500" />
                        <span>Accès immédiat à votre formation</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Prochaines étapes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentStatus === 'succeeded' ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>1. Vérifiez votre email</strong> - Les détails d'accès vous ont été envoyés
                      </p>
                      <p className="text-sm">
                        <strong>2. Accédez à votre formation</strong> - Commencez immédiatement votre apprentissage
                      </p>
                      <p className="text-sm">
                        <strong>3. Besoin d'aide ?</strong> - Contactez-nous si vous ne recevez pas votre email
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Link href="/formations">
                        <Button variant="outline" className="flex items-center gap-2" data-testid="button-browse-courses">
                          Voir d'autres formations
                        </Button>
                      </Link>
                      <Link href="/">
                        <Button className="flex items-center gap-2" data-testid="button-back-home">
                          Retour à l'accueil
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {paymentStatus === 'processing' ? (
                      <p className="text-sm">
                        Votre paiement est en cours de traitement. Vous recevrez une confirmation par email une fois le paiement validé.
                      </p>
                    ) : (
                      <p className="text-sm">
                        Si vous rencontrez des difficultés, vous pouvez réessayer ou nous contacter pour obtenir de l'aide.
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href={`/checkout/${course.slug}`}>
                        <Button variant="outline" data-testid="button-retry-payment">
                          Réessayer le paiement
                        </Button>
                      </Link>
                      <Link href={`/formation/${course.slug}`}>
                        <Button data-testid="button-back-to-course">
                          Retour à la formation
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Details */}
            {paymentIntent && paymentStatus === 'succeeded' && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">Détails de la commande</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="grid grid-cols-2 gap-2">
                    <span>Formation :</span>
                    <span>{course.title}</span>
                    <span>Prix :</span>
                    <span>{course.priceEuros}€</span>
                    <span>Référence :</span>
                    <span className="font-mono text-xs">{paymentIntent.id}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Main component that wraps with Elements
export default function ThankYouPage() {
  const { slug } = useParams();
  
  if (!slug) {
    return <NotFound />;
  }

  return (
    <Elements stripe={stripePromise}>
      <ThankYouContent slug={slug} />
    </Elements>
  );
}