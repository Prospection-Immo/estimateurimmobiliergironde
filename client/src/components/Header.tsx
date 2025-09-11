import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Calculator, FileText, Euro, Newspaper } from "lucide-react";

interface HeaderProps {
  domain?: string;
}

export default function Header({ domain = "estimation-immobilier-gironde.fr" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const isGironde = domain.includes("gironde");
  
  const navItems = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/estimation", label: "Estimation gratuite", icon: Calculator },
    { href: "/financement", label: "Financement", icon: Euro },
    { href: "/prix-m2", label: "Prix au m²", icon: FileText },
    { href: "/actualites", label: "Actualités", icon: Newspaper },
  ];


  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-md">
              <Home className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-lg">
                {isGironde ? "Estimation Gironde" : "Estimation Immobilière"}
              </h1>
              <p className="text-xs text-muted-foreground">Expert local</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors hover-elevate ${
                  location === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
                data-testid={`link-nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>


          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors hover-elevate ${
                    location === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  data-testid={`link-mobile-${item.label.toLowerCase().replace(/ /g, '-')}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}