import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Home, Building, User, Building2, UserCog, Target, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
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

interface BasicEstimation {
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  pricePerSqm: number;
}

interface SmsVerificationState {
  step: 'request' | 'verify' | 'verified';
  phoneNumber: string;
  verificationCode: string;
  isLoading: boolean;
  error: string | null;
  expiresIn?: number;
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
  const [basicEstimation, setBasicEstimation] = useState<BasicEstimation | null>(null);
  const [isCalculatingBasic, setIsCalculatingBasic] = useState(false);
  const [smsVerification, setSmsVerification] = useState<SmsVerificationState>({
    step: 'request',
    phoneNumber: '',
    verificationCode: '',
    isLoading: false,
    error: null
  });

  const totalSteps = 6; // 1-3: property info, 4: basic estimation, 5: SMS verification, 6: contact/final
  const progress = (step / totalSteps) * 100;

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate basic estimation using first 3 steps
  const calculateBasicEstimation = async (): Promise<BasicEstimation> => {
    const propertyData = {
      propertyType: formData.propertyType,
      city: formData.city,
      surface: parseInt(formData.surface) || 0,
      rooms: parseInt(formData.rooms) || 0
    };

    // Call the quick estimation API
    const response = await fetch('/api/estimations-quick', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData)
    });

    if (!response.ok) {
      throw new Error('Erreur lors du calcul de l\'estimation');
    }

    const result = await response.json();
    return {
      minPrice: result.minPrice,
      maxPrice: result.maxPrice,
      averagePrice: result.averagePrice,
      pricePerSqm: result.pricePerSqm
    };
  };

  // Send SMS verification code
  const sendSmsVerification = async (phoneNumber: string) => {
    setSmsVerification(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber })
      });

      const result = await response.json();
      
      if (result.success) {
        setSmsVerification(prev => ({ 
          ...prev, 
          step: 'verify',
          phoneNumber,
          isLoading: false,
          expiresIn: result.expiresIn 
        }));
        return true;
      } else {
        setSmsVerification(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error || 'Erreur lors de l\'envoi du SMS' 
        }));
        return false;
      }
    } catch (error) {
      setSmsVerification(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Erreur de connexion' 
      }));
      return false;
    }
  };

  // Verify SMS code
  const verifySmsCode = async (code: string) => {
    setSmsVerification(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/sms/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: smsVerification.phoneNumber, 
          code 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSmsVerification(prev => ({ 
          ...prev, 
          step: 'verified',
          isLoading: false 
        }));
        // Move to next step
        setStep(6);
        return true;
      } else {
        setSmsVerification(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error || 'Code incorrect' 
        }));
        return false;
      }
    } catch (error) {
      setSmsVerification(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Erreur de connexion' 
      }));
      return false;
    }
  };

  const nextStep = async () => {
    if (step === 3) {
      // After step 3, calculate basic estimation
      setIsCalculatingBasic(true);
      try {
        const estimation = await calculateBasicEstimation();
        setBasicEstimation(estimation);
        setStep(4);
      } catch (error) {
        console.error('Erreur estimation basique:', error);
        // For now, continue to next step even if estimation fails
        setStep(4);
      } finally {
        setIsCalculatingBasic(false);
      }
    } else if (step < totalSteps) {
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
            alt="Formulaire estimation immobilière Gironde - Évaluation gratuite"
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

        {/* Step 4: Basic Estimation Results */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Votre estimation basique</h3>
            
            {isCalculatingBasic ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Calcul de votre estimation en cours...</p>
              </div>
            ) : basicEstimation ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-primary mb-2">Estimation approximative</h4>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {basicEstimation.minPrice.toLocaleString('fr-FR')}€ - {basicEstimation.maxPrice.toLocaleString('fr-FR')}€
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Soit environ {basicEstimation.pricePerSqm.toLocaleString('fr-FR')}€/m²
                    </p>
                  </div>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">Estimation basée sur les données de marché</p>
                  </div>
                  <p className="text-muted-foreground">
                    Pour obtenir votre estimation détaillée et précise avec analyse complète,
                    <br/>
                    <strong className="text-foreground">vérifiez votre numéro de téléphone</strong>
                  </p>
                  
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 text-primary">
                      <Smartphone className="h-5 w-5" />
                      <p className="font-medium">Pourquoi vérifier mon numéro ?</p>
                    </div>
                    <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                      <li>• Estimation précise basée sur votre profil</li>
                      <li>• Analyse personnalisée de votre bien</li>
                      <li>• Accompagnement gratuit par nos experts</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">Impossible de calculer l'estimation pour le moment</p>
                <p className="text-sm text-muted-foreground">Veuillez continuer pour obtenir votre estimation détaillée</p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: SMS Verification */}
        {step === 5 && (
          <div className="space-y-6">
            {smsVerification.step === 'request' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Vérification par SMS</h3>
                  <p className="text-muted-foreground">
                    Entrez votre numéro de téléphone pour recevoir votre estimation détaillée
                  </p>
                </div>
                
                <div className="max-w-sm mx-auto">
                  <Label htmlFor="sms-phone">Numéro de téléphone</Label>
                  <Input
                    id="sms-phone"
                    type="tel"
                    value={smsVerification.phoneNumber}
                    onChange={(e) => setSmsVerification(prev => ({ ...prev, phoneNumber: e.target.value, error: null }))}
                    placeholder="06 12 34 56 78"
                    data-testid="input-sms-phone"
                    className="text-center"
                  />
                  
                  {smsVerification.error && (
                    <div className="flex items-center space-x-2 text-destructive mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm" data-testid="text-sms-error">{smsVerification.error}</span>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => sendSmsVerification(smsVerification.phoneNumber)}
                    disabled={smsVerification.isLoading || !smsVerification.phoneNumber}
                    className="w-full mt-4"
                    data-testid="button-send-sms"
                  >
                    {smsVerification.isLoading ? "Envoi en cours..." : "Envoyer le code"}
                  </Button>
                </div>
              </div>
            ) : smsVerification.step === 'verify' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Code de vérification</h3>
                  <p className="text-muted-foreground">
                    Entrez le code reçu au <strong>{smsVerification.phoneNumber}</strong>
                  </p>
                  {smsVerification.expiresIn && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Le code expire dans {Math.floor(smsVerification.expiresIn / 60)} minutes
                    </p>
                  )}
                </div>
                
                <div className="max-w-xs mx-auto">
                  <Label htmlFor="sms-code">Code de vérification</Label>
                  <Input
                    id="sms-code"
                    type="text"
                    value={smsVerification.verificationCode}
                    onChange={(e) => setSmsVerification(prev => ({ 
                      ...prev, 
                      verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                      error: null 
                    }))}
                    placeholder="123456"
                    data-testid="input-sms-code"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  
                  {smsVerification.error && (
                    <div className="flex items-center space-x-2 text-destructive mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm" data-testid="text-verify-error">{smsVerification.error}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col space-y-2 mt-4">
                    <Button
                      onClick={() => verifySmsCode(smsVerification.verificationCode)}
                      disabled={smsVerification.isLoading || smsVerification.verificationCode.length !== 6}
                      className="w-full"
                      data-testid="button-verify-sms"
                    >
                      {smsVerification.isLoading ? "Vérification..." : "Vérifier"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setSmsVerification(prev => ({ ...prev, step: 'request' }))}
                      className="w-full text-sm"
                      data-testid="button-change-phone"
                    >
                      Changer le numéro
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">Numéro vérifié !</h3>
                <p className="text-muted-foreground">Accès à votre estimation détaillée</p>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Contact Info */}
        {step === 6 && (
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
            disabled={step === 1 || (step === 5 && smsVerification.step === 'verify')}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          
          {step < totalSteps ? (
            <>
              {step === 4 ? (
                <Button
                  onClick={() => setStep(5)}
                  data-testid="button-start-sms"
                >
                  Obtenir l'estimation complète
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : step === 5 ? (
                // SMS step navigation is handled within the step content
                null
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={isCalculatingBasic}
                  data-testid="button-next-step"
                >
                  {isCalculatingBasic ? "Calcul..." : "Suivant"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </>
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