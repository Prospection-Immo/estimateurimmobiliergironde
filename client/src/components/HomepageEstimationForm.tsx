import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import SmsVerificationHome from "@/components/SmsVerificationHome";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Sparkles } from "lucide-react";

export default function HomepageEstimationForm() {
  const [propertyType, setPropertyType] = useState("");
  const [surface, setSurface] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  // BANT Qualification fields
  const [projectType, setProjectType] = useState(""); // Need: projet de vente vs renseignement
  const [timeline, setTimeline] = useState(""); // Timeline: délai souhaité
  const [ownershipStatus, setOwnershipStatus] = useState(""); // Authority: propriétaire ou mandataire
  const [step, setStep] = useState<'form' | 'verification' | 'results'>('form');
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!propertyType || !surface || !address || !projectType || !timeline || !ownershipStatus) {
      setError("Tous les champs sont requis");
      return;
    }

    if (!city || !postalCode) {
      setError("Adresse incomplète - veuillez sélectionner une adresse valide dans la liste");
      return;
    }

    if (parseInt(surface) <= 0) {
      setError("La surface doit être supérieure à 0");
      return;
    }

    // Move to SMS verification step
    setStep('verification');
  };

  const handleVerified = async (sessionId: string) => {
    // After SMS verification, process the estimation
    try {
      const response = await fetch('/api/estimations-quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyType: propertyType === "Maison" ? "house" : "apartment",
          surface: parseInt(surface),
          city,
          address,
          postalCode,
          // BANT qualification data
          projectType,
          timeline,
          ownershipStatus,
          wantsExpertContact: true,
          smsVerified: true,
          sessionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Estimation créée !",
          description: "Votre estimation a été calculée avec succès.",
        });
        // Store result in localStorage for results page
        localStorage.setItem('estimationResult', JSON.stringify(data));
        // Navigate to results page
        window.location.href = '/estimation-resultats';
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur lors du calcul de l'estimation");
        setStep('form');
      }
    } catch (error) {
      console.error('Error creating estimation:', error);
      setError("Erreur de connexion");
      setStep('form');
    }
  };

  const handleBack = () => {
    setStep('form');
  };

  if (step === 'verification') {
    const propertyData = {
      propertyType,
      surface,
      address,
      city,
      postalCode,
      projectType,
      timeline,
      ownershipStatus
    };
    
    return (
      <div className="max-w-2xl mx-auto">
        <SmsVerificationHome
          propertyData={propertyData}
          onVerified={handleVerified}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-l-4 border-l-primary pl-1">
        <Card className="p-6 bg-card shadow-lg hover-elevate relative">
          {/* Accent décoratif subtil */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-3xl"></div>
        
        <div className="relative">
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full mr-3">
              <Calculator className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <Sparkles className="w-4 h-4 text-primary/60" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold mb-6 text-card-foreground text-center leading-tight">
            Découvrez la valeur réelle de votre bien sur le prix du marché
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-card-foreground block mb-2">Type de bien</label>
              <Select value={propertyType} onValueChange={setPropertyType} required>
                <SelectTrigger data-testid="select-property-type">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maison">Maison</SelectItem>
                  <SelectItem value="Appartement">Appartement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground block mb-2">Surface (m²)</label>
              <Input
                type="number"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="Ex: 120"
                min="1"
                required
                data-testid="input-surface"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground block mb-2">Adresse du bien</label>
            <AddressAutocomplete
              onAddressSelect={(addressDetails) => {
                setAddress(addressDetails.formattedAddress);
                setCity(addressDetails.locality || '');
                setPostalCode(addressDetails.postalCode || '');
              }}
              placeholder="Commencez à taper l'adresse de votre bien..."
              required
              data-testid="input-address"
            />
          </div>

          {/* BANT Qualification Questions */}
          <div className="border-t pt-4 mt-6">
            <h4 className="text-base font-medium text-card-foreground mb-4 flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Quelques questions pour personnaliser votre estimation
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-card-foreground block mb-2">
                  Dans quel contexte souhaitez-vous cette estimation ?
                </label>
                <Select value={projectType} onValueChange={setProjectType} required>
                  <SelectTrigger data-testid="select-project-type">
                    <SelectValue placeholder="Choisissez votre situation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vente_immediate">Projet de vente immédiate</SelectItem>
                    <SelectItem value="vente_6mois">Projet de vente dans 6 mois</SelectItem>
                    <SelectItem value="vente_1an">Projet de vente dans l'année</SelectItem>
                    <SelectItem value="curiosite">Simple curiosité / renseignement</SelectItem>
                    <SelectItem value="succession">Estimation pour succession</SelectItem>
                    <SelectItem value="divorce">Estimation pour divorce</SelectItem>
                    <SelectItem value="fiscal">Estimation fiscale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-card-foreground block mb-2">
                  Si c'est un projet de vente, dans quel délai ?
                </label>
                <Select value={timeline} onValueChange={setTimeline} required>
                  <SelectTrigger data-testid="select-timeline">
                    <SelectValue placeholder="Sélectionnez un délai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_3_mois">1 à 3 mois</SelectItem>
                    <SelectItem value="3_6_mois">3 à 6 mois</SelectItem>
                    <SelectItem value="6_12_mois">6 mois à 1 an</SelectItem>
                    <SelectItem value="plus_1_an">Plus d'1 an</SelectItem>
                    <SelectItem value="non_applicable">Non applicable (pas de vente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-card-foreground block mb-2">
                  Vous êtes ?
                </label>
                <Select value={ownershipStatus} onValueChange={setOwnershipStatus} required>
                  <SelectTrigger data-testid="select-ownership">
                    <SelectValue placeholder="Votre statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proprietaire_unique">Propriétaire unique</SelectItem>
                    <SelectItem value="coproprietaire">Copropriétaire</SelectItem>
                    <SelectItem value="mandataire_famille">Mandataire (famille)</SelectItem>
                    <SelectItem value="notaire_conseil">Notaire / Conseil</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="mt-6">
            <Button 
              type="submit" 
              size="lg"
              className="w-full flex items-center gap-2" 
              data-testid="button-quick-estimate"
            >
              <Calculator className="w-5 h-5" aria-hidden="true" />
              Découvrir mes résultats maintenant
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              ✓ Vérification SMS requise pour des résultats fiables
            </p>
          </div>
        </form>
        </Card>
      </div>
    </div>
  );
}