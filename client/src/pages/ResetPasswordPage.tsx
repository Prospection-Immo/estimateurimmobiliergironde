import { useState, useEffect } from 'react';
import { Mail, ArrowLeft, Shield, Check } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [sentEmail, setSentEmail] = useState('');

  useEffect(() => {
    // Handle password recovery via auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('reset');
      }
    });

    // Also check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && window.location.hash.includes('type=recovery')) {
        setStep('reset');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setError('Erreur lors de l\'envoi de l\'email. Vérifiez l\'adresse.');
      } else {
        setSentEmail(email);
        setStep('success');
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError('Erreur lors de la mise à jour du mot de passe');
      } else {
        // Force logout for security - user must re-authenticate with new password
        await supabase.auth.signOut();
        // Redirect to admin login
        setLocation('/admin/login');
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
        <p className="text-muted-foreground text-sm">
          Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleRequestReset}>
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
            data-testid="input-reset-email"
            placeholder="admin@example.com"
          />
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
          data-testid="button-send-reset"
        >
          {isLoading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
        </button>
      </form>
      
      <div className="text-center">
        <Link href="/admin/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-2" data-testid="link-back-login">
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );

  const renderResetForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
        <p className="text-muted-foreground text-sm">
          Choisissez un nouveau mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handlePasswordReset}>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-muted-foreground">
            Nouveau mot de passe *
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            required
            data-testid="input-new-password"
            placeholder="Au moins 6 caractères"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm text-muted-foreground">
            Confirmer le mot de passe *
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            required
            data-testid="input-confirm-password"
            placeholder="Répétez le mot de passe"
          />
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
          data-testid="button-update-password"
        >
          {isLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
        </button>
      </form>
    </div>
  );

  const renderSuccess = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="bg-green-100 p-3 rounded-full">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Email envoyé</h1>
        <p className="text-muted-foreground text-sm">
          Nous avons envoyé un lien de réinitialisation à :
        </p>
        <p className="font-medium">{sentEmail}</p>
        <p className="text-muted-foreground text-xs">
          Vérifiez votre boîte email et cliquez sur le lien pour réinitialiser votre mot de passe.
        </p>
      </div>
      
      <div className="text-center">
        <Link href="/admin/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-2" data-testid="link-back-login">
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl border shadow-lg p-8">
            {step === 'request' && renderRequestForm()}
            {step === 'reset' && renderResetForm()}
            {step === 'success' && renderSuccess()}
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