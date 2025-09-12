import { useState } from "react";
import { Phone, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface SmsVerificationHomeProps {
  propertyData: {
    propertyType: string;
    surface: string;
    city: string;
  };
  onVerified: (sessionId: string) => void;
  onBack: () => void;
}

export default function SmsVerificationHome({ propertyData, onVerified, onBack }: SmsVerificationHomeProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<'contact' | 'sms' | 'code' | 'success'>('contact');
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [sessionId, setSessionId] = useState("");
  const { toast } = useToast();

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Basic validation
    if (!email || !firstName || !phoneNumber) {
      setError("Tous les champs sont requis");
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError("Veuillez entrer une adresse email valide");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/homepage-verification/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          firstName, 
          phoneNumber,
          propertyData 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setStep('sms');
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de l'initialisation");
      }
    } catch (error) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/homepage-verification/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.phoneDisplay) {
          setPhoneDisplay(data.phoneDisplay);
        }
        setStep('code');
        toast({
          title: "Code envoyé",
          description: "Vérifiez vos SMS pour le code de vérification",
        });
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de l'envoi du SMS");
      }
    } catch (error) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/homepage-verification/verify-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, code: verificationCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setStep('success');
        setTimeout(() => {
          onVerified(sessionId);
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Code invalide");
      }
    } catch (error) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'contact') {
    return (
      <Card className="max-w-2xl mx-auto p-6 bg-card border-card-border">
        <div className="text-center mb-6">
          <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-card-foreground mb-2">
            Vérification pour accéder à votre estimation
          </h3>
          <p className="text-muted-foreground text-sm">
            Pour protéger nos données et vous garantir les meilleurs résultats, nous vérifions votre identité par SMS
          </p>
        </div>

        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-card-foreground block mb-2">Prénom*</label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Jean"
                required
                data-testid="input-first-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground block mb-2">Email*</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: jean@example.com"
                required
                data-testid="input-email"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground block mb-2">Téléphone mobile*</label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ex: 06 12 34 56 78"
              required
              data-testid="input-phone"
            />
            <p className="text-xs text-muted-foreground mt-1">Format français requis (06/07)</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
              data-testid="button-back"
            >
              Retour
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              data-testid="button-verify"
            >
              {isLoading ? "Vérification..." : "Envoyer le code SMS"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  if (step === 'sms') {
    return (
      <Card className="max-w-2xl mx-auto p-6 bg-card border-card-border">
        <div className="text-center mb-6">
          <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-card-foreground mb-2">
            Prêt à envoyer le code SMS
          </h3>
          <p className="text-muted-foreground text-sm">
            Nous allons envoyer un code de vérification au numéro <strong>{phoneNumber}</strong>
          </p>
        </div>

        <form onSubmit={handleSendSms}>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('contact')}
              className="flex-1"
              data-testid="button-back-to-contact"
            >
              Modifier
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              data-testid="button-send-sms"
            >
              {isLoading ? "Envoi..." : "Envoyer le SMS"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  if (step === 'code') {
    return (
      <Card className="max-w-2xl mx-auto p-6 bg-card border-card-border">
        <div className="text-center mb-6">
          <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-card-foreground mb-2">
            Entrez le code de vérification
          </h3>
          <p className="text-muted-foreground text-sm">
            Code envoyé au {phoneDisplay || phoneNumber}
          </p>
        </div>

        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-card-foreground block mb-2">Code SMS (6 chiffres)</label>
            <Input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              data-testid="input-verification-code"
              className="text-center text-lg"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('sms')}
              className="flex-1"
              data-testid="button-resend"
            >
              Renvoyer
            </Button>
            <Button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1"
              data-testid="button-verify-code"
            >
              {isLoading ? "Vérification..." : "Vérifier"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  if (step === 'success') {
    return (
      <Card className="max-w-2xl mx-auto p-6 bg-card border-card-border">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-card-foreground mb-2">
            Vérification réussie !
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Accès à votre estimation en cours...
          </p>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}