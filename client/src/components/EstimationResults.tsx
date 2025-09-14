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
    id: string;
    address: string;
    city: string;
    postalCode: string;
    propertyType: string;
    surface?: number;
    rooms?: number;
  };
  estimation: {
    estimatedValue: string;
    pricePerM2: string;
    confidence: number;
    surface?: number;
    rooms?: number;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get estimation ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const estimationId = urlParams.get('id');
    
    console.log('URL search:', window.location.search);
    console.log('Estimation ID extracted:', estimationId);
    
    if (!estimationId || estimationId === 'null' || estimationId === 'undefined') {
      console.error('Invalid estimation ID:', estimationId);
      setError('ID d\'estimation manquant ou invalide');
      setLoading(false);
      return;
    }
    
    // Fetch estimation data from API
    const fetchEstimationData = async () => {
      try {
        const response = await fetch(`/api/estimations-results/${estimationId}`);
        if (!response.ok) {
          throw new Error('Estimation non trouvée');
        }
        
        const data = await response.json();
        setEstimationData(data);
      } catch (err) {
        console.error('Error fetching estimation data:', err);
        setError('Impossible de charger les données d\'estimation');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstimationData();
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

  if (error || !estimationData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || 'Aucune estimation trouvée'}</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'Veuillez d\'abord remplir le formulaire d\'estimation.'}
          </p>
          <a href="/" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md hover-elevate">
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
    postalCode: estimationData.lead.postalCode,
    surface: estimationData.lead.surface || estimationData.estimation?.surface || 0,
    rooms: estimationData.lead.rooms || estimationData.estimation?.rooms || 0,
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
            <div className="flex items-center justify-center space-x-2 text-muted-foreground flex-wrap">
              <Home className="h-5 w-5" />
              <span>{propertyData.type}</span>
              <span>•</span>
              <MapPin className="h-4 w-4" />
              <span>{propertyData.address}, {propertyData.postalCode} {propertyData.city}</span>
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

        {/* Call-to-Action pour l'estimation détaillée */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-primary">Vous voulez une analyse plus précise ?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cette estimation gratuite vous donne une première idée. Pour une évaluation complète avec analyse du marché local, 
              comparaisons détaillées et rapport complet, demandez votre <strong>estimation détaillée gratuite</strong>.
            </p>
            <Button size="lg" asChild data-testid="button-detailed-estimation">
              <a href="/estimation">
                Obtenir mon estimation détaillée gratuite
              </a>
            </Button>
          </div>
        </Card>

        {/* Contact simple pour plus d'informations */}
        <Card className="p-6 text-center bg-muted/30">
          <h3 className="text-lg font-semibold mb-3">Des questions sur votre estimation ?</h3>
          <p className="text-muted-foreground mb-4">
            Nos experts immobiliers locaux sont à votre disposition pour répondre à vos questions.
          </p>
          <Button variant="outline" data-testid="button-contact-expert">
            <Phone className="h-4 w-4 mr-2" />
            Contactez un expert local
          </Button>
        </Card>
      </div>
    </div>
  );
}