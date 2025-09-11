import { useState, useEffect } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Link } from "wouter";

interface Admin2FALoginProps {
  domain?: string;
}

export default function Admin2FALogin({ domain }: Admin2FALoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState<'email' | 'sms' | 'code'>('email');
  const [phoneDisplay, setPhoneDisplay] = useState("");

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'include' // Important for session cookies
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          window.location.href = '/admin';
          return;
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/auth/login-step1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.requiresSms) {
          setStep('sms');
        }
      } else {
        const data = await response.json();
        setError(data.error || "Email ou mot de passe incorrect");
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
      const response = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ phoneNumber }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.phoneDisplay) {
          setPhoneDisplay(data.phoneDisplay);
        }
        setStep('code');
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
      const response = await fetch('/api/auth/verify-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ code: verificationCode }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          window.location.href = '/admin';
        }
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

  const renderEmailStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-muted-foreground text-sm">
          Connectez-vous à votre espace admin sécurisé pour accéder au tableau de bord.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleEmailLogin}>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-muted-foreground">
            Adresse e-mail *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            required
            data-testid="input-admin-email"
            placeholder="admin@test.fr"
          />
        </div>
        
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-muted-foreground">
            Mot de passe *
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              required
              data-testid="input-admin-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              data-testid="button-toggle-password"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          data-testid="button-admin-login"
        >
          {isLoading ? "Vérification..." : "Continuer"}
        </button>
      </form>
      
      <div className="text-center">
        <Link href="/contact" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
          Problème de connexion ?
        </Link>
      </div>
    </div>
  );
  
  const renderSmsStep = () => (
    <form className="space-y-4" onSubmit={handleSendSms}>
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Pour sécuriser votre connexion, nous allons vous envoyer un code par SMS.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Numéro de téléphone
        </label>
        <input
          id="phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          required
          data-testid="input-phone-number"
          placeholder="+33 6 12 34 56 78 ou 06 12 34 56 78"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        data-testid="button-send-sms"
      >
        {isLoading ? "Envoi..." : "Envoyer le code SMS"}
      </button>
      <button
        type="button"
        onClick={() => setStep('email')}
        className="w-full text-muted-foreground hover:text-foreground text-sm"
        data-testid="button-back-email"
      >
        ← Retour
      </button>
    </form>
  );
  
  const renderCodeStep = () => {
    // Format phone number to show only last 4 digits
    const formatPhoneForDisplay = (phone: string) => {
      const cleanPhone = phone.replace(/\D/g, '');
      return `Phone ending in ${cleanPhone.slice(-4)}`;
    };
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Vérifiez votre identité</h1>
          <p className="text-muted-foreground text-sm">
            Nous avons envoyé un code de vérification à :
          </p>
          <p className="font-medium text-foreground">
            {phoneDisplay || formatPhoneForDisplay(phoneNumber)}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleVerifyCode}>
          <div className="space-y-1">
            <label htmlFor="code" className="text-sm text-muted-foreground">
              Entrez le code à 6 chiffres *
            </label>
            <input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
                // Clear error when user starts typing
                if (error && value.length > 0) {
                  setError("");
                }
              }}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-center text-lg tracking-widest"
              required
              data-testid="input-verification-code"
              placeholder=""
              maxLength={6}
            />
          </div>
          
          {/* Remember browser checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              className="rounded border-border text-primary focus:ring-primary"
              data-testid="checkbox-remember-browser"
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground">
              Se souvenir de ce navigateur pendant 30 jours
            </label>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            data-testid="button-verify-code"
          >
            {isLoading ? "Vérification..." : "Continuer"}
          </button>
        </form>
        
        {/* Help links */}
        <div className="text-center space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Vous n'avez pas reçu de code ? </span>
            <button
              type="button"
              onClick={() => setStep('sms')}
              className="text-primary hover:underline"
              data-testid="button-resend-code"
            >
              Renvoyer
            </button>
            <span className="text-muted-foreground"> ou </span>
            <Link href="/contact" className="text-primary hover:underline" data-testid="link-get-call">
              obtenir un appel
            </Link>
          </div>
          
          <button
            type="button"
            onClick={() => setStep('email')}
            className="text-sm text-primary hover:underline"
            data-testid="button-try-another-method"
          >
            Essayer une autre méthode
          </button>
        </div>
        
        <div className="text-center pt-4 border-t border-border">
          <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary" data-testid="link-mfa-help">
            Problème avec la double authentification ? Contactez-nous
          </Link>
        </div>
      </div>
    );
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <p>Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
            {/* Progress indicator - only show for SMS/Code steps */}
            {(step === 'sms' || step === 'code') && (
              <div className="flex justify-center mb-6">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div className={`w-3 h-3 rounded-full ${
                    step === 'sms' ? 'bg-primary' : 
                    step === 'code' ? 'bg-primary' : 'bg-muted'
                  }`} />
                  <div className={`w-3 h-3 rounded-full ${
                    step === 'code' ? 'bg-primary' : 'bg-muted'
                  }`} />
                </div>
              </div>
            )}
            
            {/* SMS step has title */}
            {step === 'sms' && (
              <h1 className="text-2xl font-bold mb-6 text-center">
                Vérification SMS
              </h1>
            )}
            
            {step === 'email' && renderEmailStep()}
            {step === 'sms' && renderSmsStep()}
            {step === 'code' && renderCodeStep()}
          </div>
        </div>
      </div>
      
      {/* Footer with legal links */}
      <footer className="py-6 px-4 text-center border-t border-border bg-card/50">
        <div className="space-y-3">
          <div className="flex justify-center space-x-4 text-sm">
            <Link href="/mentions-legales" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-legal">
              Mentions légales
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/politique-de-confidentialite" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-privacy">
              Confidentialité
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Estimation Immobilier Gironde. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}