import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

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
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/check');
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
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.requiresSms) {
          setSessionId(data.sessionId);
          setStep('sms');
        }
      } else {
        setError("Email ou mot de passe incorrect");
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
        body: JSON.stringify({ phoneNumber }),
      });
      
      if (response.ok) {
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
        body: JSON.stringify({ code: verificationCode }),
      });
      
      if (response.ok) {
        window.location.href = '/admin';
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
    <form className="space-y-4" onSubmit={handleEmailLogin}>
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          required
          data-testid="input-admin-email"
          placeholder="admin@test.fr"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
            data-testid="input-admin-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            data-testid="button-toggle-password"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        data-testid="button-admin-login"
      >
        {isLoading ? "Vérification..." : "Continuer"}
      </button>
    </form>
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
          placeholder="+33785611700"
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
  
  const renderCodeStep = () => (
    <form className="space-y-4" onSubmit={handleVerifyCode}>
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <div className="text-center mb-4">
        <p className="text-muted-foreground">
          Saisissez le code reçu par SMS sur le {phoneNumber}
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="code" className="text-sm font-medium">
          Code de vérification
        </label>
        <input
          id="code"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg tracking-widest"
          required
          data-testid="input-verification-code"
          placeholder="123456"
          maxLength={6}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
        data-testid="button-verify-code"
      >
        {isLoading ? "Vérification..." : "Valider"}
      </button>
      <button
        type="button"
        onClick={() => setStep('sms')}
        className="w-full text-muted-foreground hover:text-foreground text-sm"
        data-testid="button-back-sms"
      >
        ← Modifier le numéro
      </button>
    </form>
  );

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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-card p-8 rounded-lg border border-card-border">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Connexion Admin
            {step === 'sms' && ' - Vérification'}
            {step === 'code' && ' - Code SMS'}
          </h1>
          
          {/* Progress indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                step === 'email' ? 'bg-primary' : 
                ['sms', 'code'].includes(step) ? 'bg-primary' : 'bg-muted'
              }`} />
              <div className={`w-3 h-3 rounded-full ${
                step === 'sms' ? 'bg-primary' : 
                step === 'code' ? 'bg-primary' : 'bg-muted'
              }`} />
              <div className={`w-3 h-3 rounded-full ${
                step === 'code' ? 'bg-primary' : 'bg-muted'
              }`} />
            </div>
          </div>
          
          {step === 'email' && renderEmailStep()}
          {step === 'sms' && renderSmsStep()}
          {step === 'code' && renderCodeStep()}
        </div>
      </div>
    </div>
  );
}