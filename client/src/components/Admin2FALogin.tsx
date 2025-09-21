import { useState, useEffect } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabaseClient";

interface Admin2FALoginProps {
  domain?: string;
}

export default function Admin2FALogin({ domain }: Admin2FALoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        // Check if user is admin by email
        const adminEmails = ['admin@estimation-immobilier-gironde.fr', 'oliviercolas83@gmail.com'];
        if (adminEmails.includes(session.user.email || '')) {
          window.location.href = '/admin';
        } else {
          // User is authenticated but not admin - sign out
          await supabase.auth.signOut();
          setError('Accès non autorisé. Vous devez être administrateur.');
        }
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError("Email ou mot de passe incorrect");
      } else if (data.session && data.session.user) {
        // Redirect to admin - server will handle authorization
        window.location.href = '/admin';
      }
    } catch (error) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl border shadow-lg p-8">
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

              <form className="space-y-4" onSubmit={handleLogin}>
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
                    placeholder="admin@example.com"
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
                  {isLoading ? "Connexion..." : "Se connecter"}
                </button>
              </form>
              
              <div className="text-center">
                <Link href="/reset-password" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>
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