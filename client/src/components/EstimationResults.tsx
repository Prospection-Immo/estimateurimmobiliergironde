import { useState, useEffect } from "react";
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
  Calculator
} from "lucide-react";
import expertPhoto from "@assets/generated_images/Real_estate_expert_headshot_b59d45a8.png";

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
          <h1 className="text-3xl font-bold">Votre estimation immobilière</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Voici l'estimation détaillée de votre bien immobilier basée sur l'analyse 
            du marché local et des biens comparables.
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
              <span>{propertyData.city}</span>
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
                Estimation très fiable
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button onClick={handleDownloadReport} data-testid="button-download-report">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le rapport
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

        {/* Expert Contact */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <img
              src={expertPhoto}
              alt="Expert immobilier"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-semibold text-lg">Expert immobilier local</h4>
              <p className="text-muted-foreground mb-4">
                Spécialiste du marché {propertyData.city} depuis plus de 10 ans. 
                Contactez-moi pour affiner votre estimation ou pour vendre votre bien.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button variant="outline" data-testid="button-call-expert">
                  <Phone className="h-4 w-4 mr-2" />
                  05 56 XX XX XX
                </Button>
                <Button variant="outline" data-testid="button-email-expert">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6 bg-muted">
          <h3 className="text-xl font-semibold mb-4">Et maintenant ?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Vous souhaitez vendre ?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Bénéficiez d'un accompagnement personnalisé pour la vente de votre bien.
              </p>
              <Button variant="outline" data-testid="button-sell-property">
                Vendre mon bien
              </Button>
            </div>
            <div>
              <h4 className="font-medium mb-2">Besoin de financement ?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Simulez votre crédit immobilier et trouvez les meilleures conditions.
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