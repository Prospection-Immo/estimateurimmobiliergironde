import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import SmsVerificationHome from "@/components/SmsVerificationHome";
import { useToast } from "@/hooks/use-toast";

export default function HomepageEstimationForm() {
  const [propertyType, setPropertyType] = useState("");
  const [surface, setSurface] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [step, setStep] = useState<'form' | 'verification' | 'results'>('form');
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!propertyType || !surface || !address) {
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
        // For now, redirect to estimation page
        window.location.href = `/estimation?leadId=${data.lead.id}`;
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
      postalCode
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
      <Card className="p-6 bg-card border-card-border">
        <h3 className="text-xl font-semibold mb-6 text-card-foreground text-center">
          Découvrez la valeur réelle de votre bien sur le prix du marché
        </h3>
        
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

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="mt-6">
            <Button 
              type="submit" 
              className="w-full py-3 text-lg" 
              data-testid="button-quick-estimate"
            >
              Découvrir mes résultats maintenant
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              ✓ Vérification SMS requise pour des résultats fiables
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}