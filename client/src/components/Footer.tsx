import { Link } from "wouter";
import { Mail, MapPin } from "lucide-react";

interface FooterProps {
  domain?: string;
}

export default function Footer({ domain = "estimation-immobilier-gironde.fr" }: FooterProps) {
  const isGironde = domain.includes("gironde");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-primary-foreground">
              {isGironde ? "Estimation immobilière Gironde" : "Estimation Immobilière"}
            </h3>
            <p className="text-sm text-primary-foreground/80">
              Expert en estimation immobilière dans la région {isGironde ? "Gironde" : "de Bordeaux"}. 
              Évaluation précise et gratuite de votre patrimoine immobilier.
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-medium text-primary-foreground">Services</h4>
            <nav className="space-y-2">
              <Link href="/estimation" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-estimation">
                Estimation gratuite
              </Link>
              <Link href="/estimation-appartement-bordeaux" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-appartement">
                Appartement Bordeaux
              </Link>
              <Link href="/estimation-maison-gironde" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-maison">
                Maison Gironde
              </Link>
              <Link href="/prix-m2" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-prix-m2">
                Prix au m²
              </Link>
              <Link href="/formations" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-formations">
                Formations Premium
              </Link>
            </nav>
          </div>

          {/* Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-primary-foreground">Informations</h4>
            <nav className="space-y-2">
              <Link href="/actualites" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-news">
                Actualités
              </Link>
              <Link href="/tendances-marche-2025" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-tendances">
                Tendances Marché 2025
              </Link>
              <Link href="/guides" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-guide">
                Guides vendeurs
              </Link>
              <Link href="/investir" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-invest">
                Investissement
              </Link>
              <Link href="/financement" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-financing">
                Financement
              </Link>
              <Link href="/lexique-immobilier" className="block text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-lexique">
                Lexique immobilier
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-medium text-primary-foreground">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-primary-foreground/80">
                <MapPin className="h-4 w-4" />
                <span>Bordeaux, Gironde</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-primary-foreground/80">
                <Mail className="h-4 w-4" />
                <span>contact@{domain}</span>
              </div>
            </div>
            <Link href="/contact" data-testid="link-footer-contact" className="mt-6 inline-block">
              <button className="text-sm bg-primary-foreground text-primary px-4 py-2 rounded hover-elevate border border-primary-foreground">
                Nous contacter
              </button>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-primary-foreground/80">
              © {currentYear} {domain}. Tous droits réservés.
            </p>
            <nav className="flex space-x-6">
              <Link href="/mentions-legales" className="text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-legal">
                Mentions légales
              </Link>
              <Link href="/politique-de-confidentialite" className="text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-privacy">
                Confidentialité
              </Link>
              <Link href="/politique-cookies" className="text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-cookies">
                Cookies
              </Link>
              <Link href="/gironde-login" className="text-sm text-primary-foreground/80 hover:text-primary-foreground hover-elevate px-2 py-1 rounded" data-testid="link-footer-admin" aria-label="Admin">
                ·<span className="sr-only">Admin</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}