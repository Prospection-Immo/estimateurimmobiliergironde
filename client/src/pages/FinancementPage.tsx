import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Shield, Clock, Euro } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FinancementPageProps {
  domain?: string;
}

export default function FinancementPage({ domain = "estimation-immobilier-gironde.fr" }: FinancementPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    typeProjet: "Achat résidence principale",
    montant: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Split nom into firstName and lastName
      const nameParts = formData.nom.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Map form fields to API expected field names
      const payload = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.telephone || undefined,
        financingProjectType: formData.typeProjet,
        projectAmount: formData.montant,
        source: domain
      };

      await apiRequest("POST", "/api/financement-leads", payload);

      toast({
        title: "Demande envoyée avec succès",
        description: "Nous vous contacterons sous 24h pour étudier votre dossier.",
      });

      // Reset form
      setFormData({
        nom: "",
        email: "",
        telephone: "",
        typeProjet: "Achat résidence principale",
        montant: ""
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-background to-muted">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              Un projet immobilier ? Besoin d'une solution de financement fiable ?
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Profitez d'un accompagnement personnalisé pour trouver le meilleur financement, 
              adapté à votre situation et à votre projet en Gironde.
            </p>
          </div>

          {/* Promesses Section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="text-center space-y-3">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold" data-testid="text-promise-analyse">Analyse gratuite</h3>
              <p className="text-sm text-muted-foreground">de votre profil financier</p>
            </div>

            <div className="text-center space-y-3">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold" data-testid="text-promise-rapide">Étude rapide</h3>
              <p className="text-sm text-muted-foreground">de faisabilité de votre projet</p>
            </div>

            <div className="text-center space-y-3">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Euro className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold" data-testid="text-promise-solutions">Solutions adaptées</h3>
              <p className="text-sm text-muted-foreground">achat, investissement, regroupement</p>
            </div>

            <div className="text-center space-y-3">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold" data-testid="text-promise-reponse">Réponse sous 24h</h3>
              <p className="text-sm text-muted-foreground">sans engagement</p>
            </div>
          </div>

          {/* Réassurance */}
          <div className="bg-muted/50 p-6 rounded-lg border border-border mb-12">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2">Vos données sont protégées</h4>
                <p className="text-sm text-muted-foreground">
                  Nous travaillons uniquement avec des experts de confiance et ne diffusons jamais vos données. 
                  Toutes les informations sont traitées de manière confidentielle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulaire Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Obtenez une étude de financement gratuite
            </h2>
            <p className="text-muted-foreground">
              Remplissez ce formulaire et recevez une réponse personnalisée sous 24h.
            </p>
          </div>

          <Card className="shadow-lg border">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom complet *</Label>
                  <Input
                    id="nom"
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleInputChange("nom", e.target.value)}
                    placeholder="Votre nom complet"
                    required
                    data-testid="input-financement-nom"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="votre@email.com"
                    required
                    data-testid="input-financement-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone (optionnel)</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => handleInputChange("telephone", e.target.value)}
                    placeholder="06 12 34 56 78"
                    data-testid="input-financement-telephone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeProjet">Type de projet</Label>
                  <Select value={formData.typeProjet} onValueChange={(value) => handleInputChange("typeProjet", value)}>
                    <SelectTrigger data-testid="select-financement-type">
                      <SelectValue placeholder="Sélectionnez votre type de projet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Achat résidence principale">Achat résidence principale</SelectItem>
                      <SelectItem value="Investissement locatif">Investissement locatif</SelectItem>
                      <SelectItem value="Renégociation / regroupement de prêts">Renégociation / regroupement de prêts</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montant">Montant du projet (approx.)</Label>
                  <Input
                    id="montant"
                    type="text"
                    value={formData.montant}
                    onChange={(e) => handleInputChange("montant", e.target.value)}
                    placeholder="Ex. 250 000 €"
                    data-testid="input-financement-montant"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-6 text-base"
                  data-testid="button-financement-submit"
                >
                  {isSubmitting ? "Envoi en cours..." : "Demander une étude gratuite"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  📧 Réponse sous 24h • Aucune donnée transmise à des tiers
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}