import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Home, Building, User, Building2, UserCog, Target, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
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

interface CompleteEstimation {
  estimatedValue: number;
  pricePerM2: number;
  confidence: number;
  detailedAnalysis: {
    environmentalFactors: string;
    marketAnalysis: string;
    priceEvolution: string;
    recommendations: string;
    localInfrastructure: string;
  };
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
  const [sessionId, setSessionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [basicEstimation, setBasicEstimation] = useState<BasicEstimation | null>(null);
  const [isCalculatingBasic, setIsCalculatingBasic] = useState(false);
  const [completeEstimation, setCompleteEstimation] = useState<CompleteEstimation | null>(null);
  const [isCalculatingComplete, setIsCalculatingComplete] = useState(false);
  const [smsVerification, setSmsVerification] = useState<SmsVerificationState>({
    step: 'request',
    phoneNumber: '',
    verificationCode: '',
    isLoading: false,
    error: null
  });
  const [isAddressValid, setIsAddressValid] = useState(false);

  const totalSteps = 7; // 1-3: property info, 4: SMS verification, 5: email/phone, 6: complete estimation, 7: contact/final
  const progress = (step / totalSteps) * 100;

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate complete estimation when arriving at step 6 (after email/phone collection)
  useEffect(() => {
    if (step === 6 && sessionId && formData.email && !completeEstimation && !isCalculatingComplete) {
      console.log('Starting complete estimation calculation - useEffect triggered', {
        step, sessionId: sessionId ? 'present' : 'missing', 
        email: formData.email ? 'present' : 'missing', 
        completeEstimation: completeEstimation ? 'already done' : 'needed',
        isCalculatingComplete
      });
      
      const calculateCompleteEstimation = async () => {
        setIsCalculatingComplete(true);
        try {
          const estimation = await performCompleteEstimation();
          setCompleteEstimation(estimation);
          console.log('Complete estimation successful:', estimation);
        } catch (error) {
          console.error('Erreur estimation complète:', error);
          
          // Create fallback estimation with error message
          const fallbackAnalysis = error.message?.includes('saturé') 
            ? 'Analyse en cours de génération... Veuillez rafraîchir dans quelques minutes.'
            : 'Analyse temporairement non disponible. Nous travaillons à résoudre ce problème.';
            
          setCompleteEstimation({
            estimatedValue: 0,
            pricePerM2: 0,
            confidence: 0,
            detailedAnalysis: {
              environmentalFactors: fallbackAnalysis,
              marketAnalysis: fallbackAnalysis,
              priceEvolution: fallbackAnalysis,
              recommendations: 'En raison d\'une charge élevée, les recommandations détaillées seront disponibles sous peu.',
              localInfrastructure: fallbackAnalysis
            }
          });
        } finally {
          setIsCalculatingComplete(false);
        }
      };
      calculateCompleteEstimation();
    }
  }, [step, sessionId, formData.email]);

  // Calculate complete estimation with Perplexity analysis
  const performCompleteEstimation = async (): Promise<CompleteEstimation> => {
    // Use existing sessionId (must be set after SMS verification)
    if (!sessionId) {
      throw new Error('Session non valide. Veuillez vérifier votre numéro de téléphone.');
    }
    
    if (!formData.email) {
      throw new Error('Email requis pour l\'estimation complète.');
    }

    const estimationData = {
      sessionId: sessionId,
      email: formData.email,
      phone: formData.phone || '',
      propertyType: formData.propertyType,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      surface: parseInt(formData.surface) || 0,
      rooms: parseInt(formData.rooms) || 0,
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      constructionYear: parseInt(formData.constructionYear) || undefined,
      hasGarden: formData.hasGarden,
      hasParking: formData.hasParking,
      hasBalcony: formData.hasBalcony
    };

    console.log('Calculating complete estimation with data:', estimationData);

    // Call the complete estimation API with Perplexity analysis
    const response = await fetch('/api/estimations-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(estimationData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', errorData);
      
      // Handle rate limiting with user-friendly message
      if (response.status === 429) {
        throw new Error('Service temporairement saturé. Votre estimation de base est disponible. L\'analyse détaillée sera générée dans quelques minutes.');
      }
      
      // Handle other API errors
      throw new Error(errorData.error || 'Erreur lors du calcul de l\'estimation complète');
    }

    const result = await response.json();
    console.log('Complete estimation result:', result);
    return {
      estimatedValue: result.estimatedValue,
      pricePerM2: result.pricePerM2,
      confidence: result.confidence,
      detailedAnalysis: result.detailedAnalysis
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
        // CRITICAL: Only proceed if server returns a valid sessionId
        if (!result.sessionId) {
          console.error('SMS verification successful but no sessionId received from server');
          setSmsVerification(prev => ({ 
            ...prev, 
            isLoading: false,
            error: 'Erreur de session serveur - veuillez réessayer' 
          }));
          return false;
        }

        // Set sessionId from server response (never generate client-side)
        setSessionId(result.sessionId);
        console.log('SMS verification successful, using server sessionId:', result.sessionId);
        
        setSmsVerification(prev => ({ 
          ...prev, 
          step: 'verified',
          isLoading: false 
        }));
        
        // Move to email/phone collection step (step 5) only after sessionId is set
        setStep(5);
        
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
      console.error('Error in SMS verification:', error);
      setSmsVerification(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Erreur de connexion - veuillez réessayer' 
      }));
      return false;
    }
  };

  const nextStep = async () => {
    // Validation for step 2 (address)
    if (step === 2) {
      if (!formData.address || !formData.city || !formData.postalCode) {
        alert('Veuillez saisir une adresse complète');
        return;
      }
      
      // Check if postal code is in Gironde (33xxx)
      if (!formData.postalCode.startsWith('33')) {
        alert('Notre service est actuellement disponible uniquement pour la Gironde (codes postaux 33xxx)');
        return;
      }
      
      if (!isAddressValid) {
        alert('Veuillez sélectionner une adresse valide dans la liste');
        return;
      }
    }
    
    // CRITICAL GATING: Prevent bypassing SMS verification (step 4 → 5)
    if (step === 4) {
      // Multiple validation checks to prevent bypass
      if (smsVerification.step !== 'verified') {
        alert('Vous devez d\'abord vérifier votre numéro de téléphone avec le code SMS reçu.');
        console.warn('SMS verification gating: SMS not verified', {
          smsStep: smsVerification.step,
          currentStep: step
        });
        return;
      }
      
      if (!sessionId || sessionId.length === 0) {
        alert('Session invalide. Veuillez recommencer la vérification SMS.');
        console.warn('SMS verification gating: No valid sessionId', {
          sessionId: sessionId,
          sessionIdLength: sessionId?.length || 0,
          currentStep: step
        });
        // Reset SMS verification to force restart
        setSmsVerification({
          step: 'request',
          phoneNumber: '',
          verificationCode: '',
          isLoading: false,
          error: null
        });
        return;
      }
      
      // Additional validation: sessionId should be a valid UUID format (improved with better logging)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Enhanced UUID validation with better error handling
      if (!sessionId || sessionId.trim() === '' || typeof sessionId !== 'string') {
        console.error('SMS verification gating: Empty or invalid sessionId type', {
          sessionId: sessionId,
          sessionIdType: typeof sessionId,
          sessionIdLength: sessionId?.length || 0,
          currentStep: step
        });
        alert('Session invalide (vide). Veuillez recommencer la vérification SMS.');
        // Reset SMS verification to force restart
        setSmsVerification({
          step: 'request',
          phoneNumber: '',
          verificationCode: '',
          isLoading: false,
          error: null
        });
        setSessionId('');
        return;
      }
      
      // Check UUID format (but be more lenient about exact format)
      const trimmedSessionId = sessionId.trim();
      if (!uuidRegex.test(trimmedSessionId)) {
        console.error('SMS verification gating: Invalid sessionId format', {
          sessionId: sessionId,
          trimmedSessionId: trimmedSessionId,
          sessionIdLength: sessionId.length,
          regexTest: uuidRegex.test(trimmedSessionId),
          currentStep: step
        });
        
        // Only block if sessionId is clearly not a UUID (more lenient check)
        if (trimmedSessionId.length < 30 || !trimmedSessionId.includes('-')) {
          alert('Format de session invalide. Veuillez recommencer la vérification SMS.');
          // Reset SMS verification to force restart
          setSmsVerification({
            step: 'request',
            phoneNumber: '',
            verificationCode: '',
            isLoading: false,
            error: null
          });
          setSessionId('');
          return;
        } else {
          // Log the issue but allow progression (more permissive)
          console.warn('SessionId format non-standard mais probablement valide, autorisation de continuer:', {
            sessionId: trimmedSessionId
          });
        }
      }
      
      console.log('SMS verification gating: All checks passed', {
        smsStep: smsVerification.step,
        sessionId: sessionId,
        currentStep: step
      });
    }
    
    // Validation for step 5 (email/phone collection)
    if (step === 5) {
      if (!formData.email || !formData.email.includes('@')) {
        alert('Veuillez saisir une adresse email valide');
        return;
      }
    }
    
    // Additional gating: Prevent accessing step 5+ without proper SMS verification
    if (step >= 5) {
      if (smsVerification.step !== 'verified' || !sessionId) {
        alert('Accès non autorisé. Veuillez recommencer la vérification SMS.');
        console.error('Unauthorized access attempt to protected step', {
          step,
          smsVerificationStep: smsVerification.step,
          hasSessionId: !!sessionId
        });
        // Force user back to SMS verification step
        setStep(4);
        setSmsVerification({
          step: 'request',
          phoneNumber: '',
          verificationCode: '',
          isLoading: false,
          error: null
        });
        setSessionId('');
        return;
      }
    }
    
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
              <AddressAutocomplete
                value={formData.address}
                onAddressSelect={(addressDetails) => {
                  console.log("Address selected:", addressDetails);
                  updateFormData("address", addressDetails.formattedAddress);
                  updateFormData("city", addressDetails.locality || "");
                  updateFormData("postalCode", addressDetails.postalCode || "");
                  
                  // Validate Gironde postal code (33xxx)
                  const isGironde = addressDetails.postalCode?.startsWith('33') || false;
                  setIsAddressValid(isGironde);
                  
                  if (!isGironde) {
                    console.log("Address validation: Only Gironde addresses (33xxx) are allowed");
                  } else {
                    console.log("Address validated: Gironde address accepted");
                  }
                }}
                placeholder="Commencez à taper votre adresse (ex: 12 rue de la Paix, Bordeaux)"
                data-testid="input-address-detailed"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    placeholder="Ex: Bordeaux"
                    data-testid="input-city-form"
                    readOnly
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
                    readOnly
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

        {/* Step 4: SMS Verification */}
        {step === 4 && (
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

        {/* Step 5: Email/Phone Collection */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Vos coordonnées pour l'estimation détaillée</h3>
              <p className="text-muted-foreground">
                Recevez votre rapport d'expertise immobilière complet par email.
                <br/>Analyse approfondie avec comparaisons de marché et conseils d'expert.
              </p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <Label htmlFor="email-collection">Adresse email *</Label>
                <Input
                  id="email-collection"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="votre@email.com"
                  data-testid="input-email-collection"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone-collection">Téléphone (optionnel)</Label>
                <Input
                  id="phone-collection"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="06 12 34 56 78"
                  data-testid="input-phone-collection"
                />
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-primary mb-2">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">Rapport d'expertise inclus :</p>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Estimation précise avec analyse Perplexity IA</li>
                <li>• Étude de marché spécifique à votre quartier</li>
                <li>• Analyse des infrastructures et environnement</li>
                <li>• Conseils personnalisés pour optimiser la vente</li>
                <li>• Tendances et évolution des prix</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 6: Complete Estimation with Perplexity Analysis */}
        {step === 6 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Votre estimation complète</h3>
            
            {isCalculatingComplete ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
                <h4 className="text-lg font-semibold mb-2">Analyse en cours...</h4>
                <p className="text-muted-foreground">Notre IA analyse votre bien et le marché local</p>
                <div className="mt-4 max-w-sm mx-auto">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>✓ Analyse des données de marché</p>
                    <p>✓ Étude de l'environnement local</p>
                    <p>✓ Comparaison avec les ventes récentes</p>
                    <p>✓ Génération des recommandations...</p>
                  </div>
                </div>
              </div>
            ) : completeEstimation ? (
              <div className="space-y-8">
                {/* Prix principal */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-8 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <h4 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-3">Estimation finale</h4>
                    <div className="text-5xl font-bold text-foreground mb-2">
                      {completeEstimation.estimatedValue.toLocaleString('fr-FR')}€
                    </div>
                    <div className="text-lg text-muted-foreground mb-1">
                      {completeEstimation.pricePerM2.toLocaleString('fr-FR')}€/m²
                    </div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                      Fiabilité: {completeEstimation.confidence}%
                    </div>
                  </div>
                </div>
                
                {/* Analyses détaillées */}
                <div className="grid gap-6">
                  <div className="p-6 border border-border rounded-lg">
                    <h5 className="font-semibold text-lg mb-3 flex items-center">
                      <Building className="h-5 w-5 mr-2 text-primary" />
                      Analyse de l'environnement
                    </h5>
                    <p className="text-muted-foreground whitespace-pre-line">{completeEstimation.detailedAnalysis.environmentalFactors}</p>
                  </div>
                  
                  <div className="p-6 border border-border rounded-lg">
                    <h5 className="font-semibold text-lg mb-3 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-primary" />
                      Analyse du marché local
                    </h5>
                    <p className="text-muted-foreground whitespace-pre-line">{completeEstimation.detailedAnalysis.marketAnalysis}</p>
                  </div>
                  
                  <div className="p-6 border border-border rounded-lg">
                    <h5 className="font-semibold text-lg mb-3 flex items-center">
                      <ArrowRight className="h-5 w-5 mr-2 text-primary" />
                      Évolution des prix
                    </h5>
                    <p className="text-muted-foreground whitespace-pre-line">{completeEstimation.detailedAnalysis.priceEvolution}</p>
                  </div>
                  
                  <div className="p-6 border border-border rounded-lg">
                    <h5 className="font-semibold text-lg mb-3 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-primary" />
                      Infrastructures locales
                    </h5>
                    <p className="text-muted-foreground whitespace-pre-line">{completeEstimation.detailedAnalysis.localInfrastructure}</p>
                  </div>
                  
                  <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
                    <h5 className="font-semibold text-lg mb-3 flex items-center text-primary">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Recommandations d'expert
                    </h5>
                    <p className="text-muted-foreground whitespace-pre-line">{completeEstimation.detailedAnalysis.recommendations}</p>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💌 Un rapport détaillé a été envoyé à <strong>{formData.email}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">Impossible de calculer l'estimation complète pour le moment</p>
                <p className="text-sm text-muted-foreground">Veuillez contacter notre équipe pour obtenir votre estimation</p>
              </div>
            )}
          </div>
        )}
        
        {/* Step 7: Contact Info */}
        {step === 7 && (
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
            disabled={step === 1 || (step === 4 && smsVerification.step === 'verify') || step === 6}
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
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : step === 6 ? (
                // Complete estimation step - no navigation button
                null
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={isCalculatingComplete || (step === 2 && (!formData.address || !isAddressValid)) || (step === 5 && !formData.email)}
                  data-testid="button-next-step"
                >
                  {step === 5 ? "Obtenir l'estimation complète" : "Suivant"}
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