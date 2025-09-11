import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Shield, Clock, Euro, Users, TrendingUp, Lightbulb, Target, Compass, Mail, Phone, AlertTriangle } from "lucide-react";
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
      {/* Main Content */}
      <section className="py-8 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">
              Solutions de financement immobilier en Gironde pour votre projet
            </h1>
          </div>
        </div>
      </section>

      {/* Hero Section - Emotional Hook */}
      <section className="relative py-16 bg-gradient-to-br from-destructive/5 to-destructive/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-lg leading-relaxed">
                En Gironde, chaque semaine, des acheteurs sérieux voient leur rêve s'effondrer. 
                Non pas parce qu'ils n'ont pas trouvé le bon bien. 
                Mais parce qu'ils n'ont pas su défendre leur dossier ou présenter leur projet sous le bon angle aux banques.
              </p>
              <p className="text-lg font-semibold text-destructive">
                Et ça, c'est injuste.
              </p>
              <p className="text-lg font-medium">
                Vous avez un projet solide. Vous méritez un financement à la hauteur de votre ambition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accompagnement Section */}
      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lightbulb className="h-8 w-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">
                Un accompagnement humain, local… et stratégique
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Grâce à notre réseau de courtiers partenaires experts en Gironde, 
              vous bénéficiez d'un soutien personnalisé, quel que soit votre profil :
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Primo-accédant</h3>
                <p className="text-sm text-muted-foreground">
                  Premier achat ? Nous vous accompagnons dans cette étape cruciale.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Indépendant / freelance</h3>
                <p className="text-sm text-muted-foreground">
                  Profil atypique ? Nous savons valoriser votre situation.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Investisseur locatif</h3>
                <p className="text-sm text-muted-foreground">
                  Optimisez votre stratégie d'investissement immobilier.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Projet atypique ou urgent</h3>
                <p className="text-sm text-muted-foreground">
                  Situation complexe ? Nous trouvons des solutions adaptées.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3 Étapes Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Compass className="h-8 w-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">
                3 étapes simples pour débloquer votre financement
              </h2>
            </div>
          </div>

          <div className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Analyse confidentielle de votre profil financier</h3>
                    <p className="text-muted-foreground">gratuite, sans engagement</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Étude de faisabilité express sous 24h</h3>
                    <p className="text-muted-foreground">avec recommandations concrètes pour optimiser votre dossier</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Proposition de solutions sur-mesure</h3>
                    <p className="text-muted-foreground">achat, regroupement, investissement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistiques Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">
                Ce que nos partenaires ont déjà permis
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">87%</div>
                <p className="text-sm text-muted-foreground">
                  des projets financés dès le 1er passage en banque
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">0,6%</div>
                <p className="text-sm text-muted-foreground">
                  Taux négociés jusqu'à 0,6% plus bas que la moyenne
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <p className="text-sm text-muted-foreground">
                  Dossiers acceptés pour des profils atypiques (CDD, indépendants…)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Ce que vous obtenez Section */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="h-8 w-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">
                Ce que vous obtenez
              </h2>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1" data-testid="text-promise-analyse">Une vision claire de ce que vous pouvez financer</h3>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1" data-testid="text-promise-rapide">Des options concrètes pour faire avancer votre projet</h3>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1" data-testid="text-promise-solutions">La confiance de savoir que vous êtes bien accompagné(e)</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projet de vie Section */}
      <section className="py-16 bg-primary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" data-testid="text-promise-reponse">
            Ce n'est pas qu'un prêt. C'est un projet de vie qui avance.
          </h2>
          <div className="space-y-4 text-lg">
            <p>En quelques clics, vous passez de l'incertitude à l'action.</p>
            <p>Vous montrez que vous prenez votre projet au sérieux.</p>
            <p className="font-semibold">Et surtout… vous reprenez le pouvoir sur votre parcours immobilier.</p>
          </div>
        </div>
      </section>

      {/* Formulaire Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Mail className="h-8 w-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">
                Recevez votre étude de financement personnalisée (et confidentielle)
              </h2>
            </div>
            <p className="text-muted-foreground">
              Remplissez ce formulaire, et recevez une réponse claire en 24h, sans aucun engagement.
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
                  <Label htmlFor="telephone">Téléphone (facultatif)</Label>
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
                  <Label htmlFor="montant">Montant estimé du projet</Label>
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

                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Vos données sont strictement confidentielles. Aucune revente. Aucun spam.
                      Réponse sous 24h • Aucune donnée transmise à des tiers
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold mb-6">Encore des doutes ?</h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <Phone className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Contactez-nous par téléphone</h3>
                <p className="text-muted-foreground text-sm">05 56 XX XX XX</p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Écrivez-nous par email</h3>
                <p className="text-muted-foreground text-sm">contact@estimation-immobilier-gironde.fr</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center justify-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <p className="font-semibold text-lg">
                Estimation Gironde — Bien plus que l'estimation de votre bien : le partenaire local de vos projets immobiliers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}