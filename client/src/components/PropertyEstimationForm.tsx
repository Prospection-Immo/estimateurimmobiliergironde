import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Home, Building, User, Building2, UserCog, Target } from "lucide-react";
import bordeaux_house from "@assets/generated_images/Bordeaux_house_property_photo_41cf0370.png";

interface FormData {
  propertyType: "house" | "apartment";
  address: string;
  city: string;
  postalCode: string;
  surface: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  constructionYear: string;
  hasGarden: boolean;
  hasParking: boolean;
  hasBalcony: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  saleTimeline: "3m" | "6m" | "immediate";
  saleMethod: "self" | "agency" | "advisor" | "coach";
  wantsExpertContact: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  propertyType: "house",
  address: "",
  city: "",
  postalCode: "",
  surface: "",
  rooms: "",
  bedrooms: "",
  bathrooms: "",
  constructionYear: "",
  hasGarden: false,
  hasParking: false,
  hasBalcony: false,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  saleTimeline: "6m",
  saleMethod: "agency",
  wantsExpertContact: false,
};

export default function PropertyEstimationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/estimations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          surface: parseInt(formData.surface) || 0,
          rooms: parseInt(formData.rooms) || 0,
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          constructionYear: parseInt(formData.constructionYear) || undefined,
          saleTimeline: formData.saleTimeline,
          saleMethod: formData.saleMethod,
          wantsExpertContact: formData.wantsExpertContact,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Store result in localStorage for results page
        localStorage.setItem('estimationResult', JSON.stringify(result));
        // Navigate to results page
        window.location.href = '/estimation-resultats';
      } else {
        console.error('Estimation failed');
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error submitting estimation:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] bg-gradient-to-br from-background to-muted flex items-center">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={bordeaux_house}
            alt="Belle propriété en Gironde"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 w-full">
          {/* Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Estimation gratuite de votre bien
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mt-3">
              Service d'expertise immobilière
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-base sm:text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Obtenez une estimation précise et gratuite de votre propriété en Gironde. 
              Notre expertise locale vous garantit une évaluation fiable pour votre projet de vente.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="p-6">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Votre estimation gratuite et garantie</h2>
            <span className="text-sm text-muted-foreground">
              Étape {step} sur {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Property Type */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Votre bien immobilier</h3>
            <RadioGroup
              value={formData.propertyType}
              onValueChange={(value) => updateFormData("propertyType", value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover-elevate cursor-pointer">
                <RadioGroupItem value="house" id="house" data-testid="radio-house" />
                <Label htmlFor="house" className="flex items-center space-x-3 cursor-pointer">
                  <Home className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Maison</p>
                    <p className="text-sm text-muted-foreground">Villa, pavillon, maison de ville</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover-elevate cursor-pointer">
                <RadioGroupItem value="apartment" id="apartment" data-testid="radio-apartment" />
                <Label htmlFor="apartment" className="flex items-center space-x-3 cursor-pointer">
                  <Building className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Appartement</p>
                    <p className="text-sm text-muted-foreground">Studio, T1, T2, T3...</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Localisation de votre propriété</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Ex: 123 rue de la Paix"
                  data-testid="input-address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    placeholder="Ex: Bordeaux"
                    data-testid="input-city-form"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData("postalCode", e.target.value)}
                    placeholder="Ex: 33000"
                    data-testid="input-postal-code"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Property Details */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Caractéristiques pour des résultats précis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="surface">Surface (m²)</Label>
                <Input
                  id="surface"
                  type="number"
                  value={formData.surface}
                  onChange={(e) => updateFormData("surface", e.target.value)}
                  placeholder="Ex: 85"
                  data-testid="input-surface-form"
                />
              </div>
              <div>
                <Label htmlFor="rooms">Pièces</Label>
                <Input
                  id="rooms"
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => updateFormData("rooms", e.target.value)}
                  placeholder="Ex: 4"
                  data-testid="input-rooms"
                />
              </div>
              <div>
                <Label htmlFor="bedrooms">Chambres</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => updateFormData("bedrooms", e.target.value)}
                  placeholder="Ex: 2"
                  data-testid="input-bedrooms"
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Salles de bain</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => updateFormData("bathrooms", e.target.value)}
                  placeholder="Ex: 1"
                  data-testid="input-bathrooms"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="constructionYear">Année de construction</Label>
              <Input
                id="constructionYear"
                type="number"
                value={formData.constructionYear}
                onChange={(e) => updateFormData("constructionYear", e.target.value)}
                placeholder="Ex: 1985"
                data-testid="input-construction-year"
              />
            </div>

            <div className="space-y-4">
              <Label>Options et équipements</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasGarden"
                    checked={formData.hasGarden}
                    onCheckedChange={(checked) => updateFormData("hasGarden", checked)}
                    data-testid="checkbox-garden"
                  />
                  <Label htmlFor="hasGarden">Jardin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasParking"
                    checked={formData.hasParking}
                    onCheckedChange={(checked) => updateFormData("hasParking", checked)}
                    data-testid="checkbox-parking"
                  />
                  <Label htmlFor="hasParking">Parking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasBalcony"
                    checked={formData.hasBalcony}
                    onCheckedChange={(checked) => updateFormData("hasBalcony", checked)}
                    data-testid="checkbox-balcony"
                  />
                  <Label htmlFor="hasBalcony">Balcon/Terrasse</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Contact Info */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Vos coordonnées</h3>
            <p className="text-muted-foreground">
              Pour recevoir gratuitement votre rapport d'estimation détaillé - solution complète garantie
            </p>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData("firstName", e.target.value)}
                    placeholder="Votre prénom"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData("lastName", e.target.value)}
                    placeholder="Votre nom"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="votre@email.com"
                  data-testid="input-email-form"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="06 12 34 56 78"
                  data-testid="input-phone-form"
                />
              </div>
            </div>

            {/* Sales Timeline Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <Label>Projet de vente</Label>
              <RadioGroup
                value={formData.saleTimeline}
                onValueChange={(value) => updateFormData("saleTimeline", value)}
                className="grid grid-cols-1 gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3m" id="timeline-3m" data-testid="radio-timeline-3m" />
                  <Label htmlFor="timeline-3m" className="cursor-pointer">Dans 3 mois</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6m" id="timeline-6m" data-testid="radio-timeline-6m" />
                  <Label htmlFor="timeline-6m" className="cursor-pointer">Dans 6 mois</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="timeline-immediate" data-testid="radio-timeline-immediate" />
                  <Label htmlFor="timeline-immediate" className="cursor-pointer">Vente immédiate</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Sale Method Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <Label>Comment comptez-vous vendre votre bien ?</Label>
              <RadioGroup
                value={formData.saleMethod}
                onValueChange={(value) => updateFormData("saleMethod", value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover-elevate cursor-pointer">
                  <RadioGroupItem value="self" id="sale-self" data-testid="radio-sale-self" />
                  <Label htmlFor="sale-self" className="flex items-center space-x-3 cursor-pointer">
                    <User className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Par moi-même</p>
                      <p className="text-sm text-muted-foreground">Vente directe</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover-elevate cursor-pointer">
                  <RadioGroupItem value="agency" id="sale-agency" data-testid="radio-sale-agency" />
                  <Label htmlFor="sale-agency" className="flex items-center space-x-3 cursor-pointer">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Avec une agence</p>
                      <p className="text-sm text-muted-foreground">Agence immobilière</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover-elevate cursor-pointer">
                  <RadioGroupItem value="advisor" id="sale-advisor" data-testid="radio-sale-advisor" />
                  <Label htmlFor="sale-advisor" className="flex items-center space-x-3 cursor-pointer">
                    <UserCog className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Avec un conseiller</p>
                      <p className="text-sm text-muted-foreground">Conseiller immobilier</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover-elevate cursor-pointer">
                  <RadioGroupItem value="coach" id="sale-coach" data-testid="radio-sale-coach" />
                  <Label htmlFor="sale-coach" className="flex items-center space-x-3 cursor-pointer">
                    <Target className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Avec un coach</p>
                      <p className="text-sm text-muted-foreground">Coach immobilier</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Expert Contact Message - shown when immediate sale is selected */}
              {formData.saleTimeline === "immediate" && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                    <p className="text-sm text-primary font-medium" data-testid="text-immediate-expert-note">
                      Notre solution exclusive : un expert local vous appellera gratuitement pour vous faire gagner du temps dans votre vente immédiate.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="expertContact"
                      checked={formData.wantsExpertContact}
                      onCheckedChange={(checked) => updateFormData("wantsExpertContact", checked)}
                      data-testid="checkbox-expert-consent"
                    />
                    <Label htmlFor="expertContact" className="text-sm cursor-pointer">
                      J'accepte d'être contacté par un expert local
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          
          {step < totalSteps ? (
            <Button
              onClick={nextStep}
              data-testid="button-next-step"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-testid="button-submit-estimation"
            >
              {isSubmitting ? "Calcul de vos résultats..." : "Recevoir mes résultats gratuits"}
            </Button>
          )}
        </div>
      </Card>
        </div>
      </section>
    </div>
  );
}