import { Link } from "wouter";
import { Mail, Phone, MapPin, Facebook, Linkedin, Twitter } from "lucide-react";

interface FooterProps {
  domain?: string;
}

export default function Footer({ domain = "estimation-immobilier-gironde.fr" }: FooterProps) {
  const isGironde = domain.includes("gironde");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {isGironde ? "Estimation Gironde" : "Estimation Immobilière"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Expert en estimation immobilière dans la région {isGironde ? "Gironde" : "de Bordeaux"}. 
              Évaluation précise et gratuite de votre patrimoine immobilier.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary hover-elevate p-2 rounded" data-testid="link-facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary hover-elevate p-2 rounded" data-testid="link-linkedin">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary hover-elevate p-2 rounded" data-testid="link-twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-medium">Services</h4>
            <nav className="space-y-2">
              <Link href="/estimation" className="block text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-estimation">
                Estimation gratuite
              </Link>
              <Link href="/estimation-appartement-bordeaux" className="block text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-appartement">
                Appartement Bordeaux
              </Link>
              <Link href="/estimation-maison-gironde" className="block text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-maison">
                Maison Gironde
              </Link>
              <Link href="/prix-m2" className="block text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-prix-m2">
                Prix au m²
              </Link>
            </nav>
          </div>

          {/* Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Informations</h4>
            <nav className="space-y-2">
              <Link href="/actualites" className="block text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-news">
                Actualités
              </Link>
              <Link href="/guide-landing" className="block text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-guide">
                Guide immobilier
              </Link>
              <Link href="/investir" className="block text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-invest">
                Investissement
              </Link>
              <Link href="/financement" className="block text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-financing">
                Financement
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-medium">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Bordeaux, Gironde</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>05 56 XX XX XX</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@{domain}</span>
              </div>
            </div>
            <Link href="/contact" data-testid="link-footer-contact">
              <button className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded hover-elevate">
                Nous contacter
              </button>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {domain}. Tous droits réservés.
            </p>
            <nav className="flex space-x-6">
              <Link href="/mentions-legales" className="text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-legal">
                Mentions légales
              </Link>
              <Link href="/politique-de-confidentialite" className="text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-privacy">
                Confidentialité
              </Link>
              <Link href="/politique-cookies" className="text-sm text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded" data-testid="link-footer-cookies">
                Cookies
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}