import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Home, 
  MapPin, 
  TrendingUp, 
  Download, 
  Phone, 
  Mail,
  Share2,
  Calculator,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface EstimationData {
  lead: {
    address: string;
    city: string;
    propertyType: string;
    surface: number;
    rooms: number;
  };
  estimation: {
    estimatedValue: string;
    pricePerM2: string;
    confidence: number;
  };
  calculatedData: {
    estimatedValue: number;
    pricePerM2: number;
    confidence: number;
  };
}

export default function EstimationResults() {
  const [estimationData, setEstimationData] = useState<EstimationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get estimation data from localStorage (set by form submission)
    const savedData = localStorage.getItem('estimationResult');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setEstimationData(parsed);
      } catch (error) {
        console.error('Error parsing estimation data:', error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p>Chargement de votre estimation...</p>
        </div>
      </div>
    );
  }

  if (!estimationData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Aucune estimation trouvée</h1>
          <p className="text-muted-foreground mb-6">
            Veuillez d'abord remplir le formulaire d'estimation.
          </p>
          <a href="/estimation" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md hover-elevate">
            Faire une estimation
          </a>
        </div>
      </div>
    );
  }

  const propertyData = {
    type: estimationData.lead.propertyType === 'house' ? 'Maison' : 'Appartement',
    address: estimationData.lead.address,
    city: estimationData.lead.city,
    surface: estimationData.lead.surface,
    rooms: estimationData.lead.rooms,
    estimatedValue: estimationData.calculatedData.estimatedValue,
    pricePerM2: estimationData.calculatedData.pricePerM2,
    confidence: estimationData.calculatedData.confidence
  };
  const handleDownloadReport = () => {
    console.log("Download report clicked");
    // TODO: Implement PDF generation
  };

  const handleRequestContact = () => {
    console.log("Request contact clicked");
    // TODO: Navigate to contact form or show modal
  };

  const handleShare = () => {
    console.log("Share clicked");
    // TODO: Implement sharing functionality
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Vos résultats exclusifs obtenus</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez votre estimation personnalisée gratuite basée sur notre nouvelle solution d'analyse 
            du marché local - vous pouvez maintenant gagner en confiance pour votre décision.
          </p>
        </div>

        {/* Main Estimation Card */}
        <Card className="p-8 text-center">
          <div className="space-y-6">
            {/* Property Info */}
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Home className="h-5 w-5" />
              <span>{propertyData.type}</span>
              <span>•</span>
              <MapPin className="h-4 w-4" />
              <span>{propertyData.address}</span>
            </div>

            {/* Estimated Value */}
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-bold text-primary" data-testid="text-estimated-value">
                {propertyData.estimatedValue.toLocaleString()} €
              </h2>
              <p className="text-lg text-muted-foreground">
                Soit {propertyData.pricePerM2.toLocaleString()} € / m²
              </p>
            </div>

            {/* Confidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="h-5 w-5 text-chart-2" />
                <span className="font-medium">Fiabilité de l'estimation</span>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <Progress value={propertyData.confidence} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0%</span>
                  <span className="font-medium">{propertyData.confidence}%</span>
                  <span>100%</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                Résultats garantis exclusifs
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button onClick={handleDownloadReport} data-testid="button-download-report">
                <Download className="h-4 w-4 mr-2" />
                Estimation en ligne pour complète et détaillée
              </Button>
              <Button variant="outline" onClick={handleRequestContact} data-testid="button-contact-expert">
                <Phone className="h-4 w-4 mr-2" />
                Contacter un expert
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} data-testid="button-share">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Property Details */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6">Détails du bien</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-muted p-4 rounded-lg mb-2">
                <Calculator className="h-6 w-6 text-primary mx-auto" />
              </div>
              <p className="font-semibold" data-testid="text-surface">{propertyData.surface} m²</p>
              <p className="text-sm text-muted-foreground">Surface</p>
            </div>
            <div className="text-center">
              <div className="bg-muted p-4 rounded-lg mb-2">
                <Home className="h-6 w-6 text-primary mx-auto" />
              </div>
              <p className="font-semibold" data-testid="text-rooms">{propertyData.rooms} pièces</p>
              <p className="text-sm text-muted-foreground">Nombre de pièces</p>
            </div>
            <div className="text-center">
              <div className="bg-muted p-4 rounded-lg mb-2">
                <MapPin className="h-6 w-6 text-primary mx-auto" />
              </div>
              <p className="font-semibold" data-testid="text-location">{propertyData.city}</p>
              <p className="text-sm text-muted-foreground">Localisation</p>
            </div>
            <div className="text-center">
              <div className="bg-muted p-4 rounded-lg mb-2">
                <TrendingUp className="h-6 w-6 text-primary mx-auto" />
              </div>
              <p className="font-semibold" data-testid="text-price-m2">{propertyData.pricePerM2.toLocaleString()} €/m²</p>
              <p className="text-sm text-muted-foreground">Prix au m²</p>
            </div>
          </div>
        </Card>

        {/* Market Analysis */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-6">Analyse du marché</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-chart-2">275 000 €</p>
              <p className="text-sm text-muted-foreground">Fourchette basse</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{propertyData.estimatedValue.toLocaleString()} €</p>
              <p className="text-sm text-muted-foreground">Estimation centrale</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-chart-3">295 000 €</p>
              <p className="text-sm text-muted-foreground">Fourchette haute</p>
            </div>
          </div>
        </Card>

        {/* Support Section */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Notre solution d'accompagnement gratuite</h4>
              <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                Vous bénéficiez d'un accès exclusif à nos experts immobiliers locaux. 
                Contactez-nous pour optimiser vos résultats et économiser du temps avec nos conseils garantis.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" data-testid="button-call-expert">
                  <Phone className="h-4 w-4 mr-2" />
                  05 56 XX XX XX
                </Button>
                <Button variant="outline" data-testid="button-email-expert">
                  <Mail className="h-4 w-4 mr-2" />
                  Nous contacter
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Free Guides */}
        <div className="bg-gradient-to-br from-muted/50 to-muted p-6 rounded-lg">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">Nouvelle solution : guides gratuits pour gagner plus</h3>
            <p className="text-muted-foreground">
              Accédez à nos guides exclusifs pour maximiser vos résultats et économiser des milliers d'euros
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 hover-elevate">
              <div className="flex items-start space-x-4">
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">7 erreurs coûteuses à éviter - Solution gratuite</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Notre guide exclusif vous fait économiser des milliers d'euros - résultats garantis
                  </p>
                  <Button variant="outline" data-testid="button-guide-errors" asChild>
                    <Link href="/actualites/7-erreurs-a-eviter-vente-bien-gironde">
                      Lire le guide
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="p-6 hover-elevate">
              <div className="flex items-start space-x-4">
                <div className="bg-chart-2/10 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-chart-2" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Nouvelle stratégie : 5 actions pour gagner du temps</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Votre solution gratuite exclusive pour des résultats rapides garantis sans dépenser un euro
                  </p>
                  <Button variant="outline" data-testid="button-guide-practices" asChild>
                    <Link href="/actualites/5-bonnes-choses-a-faire-gratuitement-pour-vendre-rapidement-en-gironde">
                      Lire le guide
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <Card className="p-6 bg-muted">
          <h3 className="text-xl font-semibold mb-4">Vos prochaines étapes pour gagner plus ?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Vous voulez gagner plus en vendant ?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Notre solution exclusive d'accompagnement vous garantit de meilleurs résultats.
              </p>
              <Button variant="outline" data-testid="button-sell-property">
                Vendre mon bien
              </Button>
            </div>
            <div>
              <h4 className="font-medium mb-2">Nouvelle solution de financement ?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Économisez sur votre crédit avec notre solution gratuite exclusive.
              </p>
              <Button variant="outline" data-testid="button-financing">
                Simulation crédit
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}