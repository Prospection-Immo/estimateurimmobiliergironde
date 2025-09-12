import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Send } from "lucide-react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: ""
        });
        
        // TODO: Show success toast notification
        alert("Votre message a été envoyé avec succès ! Nous vous recontacterons rapidement.");
      } else {
        console.error('Contact submission failed');
        alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
      }
    } catch (error) {
      console.error('Error submitting contact:', error);
      alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Votre solution d'accompagnement gratuite</h1>
            <p className="text-lg text-muted-foreground">
              Découvrez notre équipe d'experts exclusifs à votre disposition pour vous faire gagner du temps et obtenir des résultats garantis sur l'estimation de votre bien.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Votre accès exclusif par email</h3>
                <p className="text-muted-foreground">contact@estimation-immobilier-gironde.fr</p>
                <p className="text-sm text-muted-foreground">Résultats garantis sous 24h</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Zone d'intervention</h3>
                <p className="text-muted-foreground">Bordeaux et toute la Gironde</p>
                <p className="text-sm text-muted-foreground">Déplacements sur rendez-vous</p>
              </div>
            </div>
          </div>

          {/* Why Contact Us */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Pourquoi nous contacter ?</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>Affiner votre estimation immobilière</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>Obtenir des conseils pour valoriser votre bien</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>Planifier une visite d'expertise gratuite</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>Discuter de votre projet de vente</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-semibold">Envoyez-nous un message</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  required
                  data-testid="input-contact-first-name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  required
                  data-testid="input-contact-last-name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                data-testid="input-contact-email"
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="06 12 34 56 78"
                data-testid="input-contact-phone"
              />
            </div>

            <div>
              <Label htmlFor="subject">Sujet *</Label>
              <Select onValueChange={(value) => updateField("subject", value)} required>
                <SelectTrigger data-testid="select-contact-subject">
                  <SelectValue placeholder="Choisissez un sujet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estimation">Question sur une estimation</SelectItem>
                  <SelectItem value="visite">Demande de visite d'expertise</SelectItem>
                  <SelectItem value="vente">Projet de vente</SelectItem>
                  <SelectItem value="conseil">Conseil en valorisation</SelectItem>
                  <SelectItem value="autre">Autre demande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => updateField("message", e.target.value)}
                placeholder="Décrivez votre demande..."
                rows={6}
                required
                data-testid="textarea-contact-message"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
              data-testid="button-submit-contact"
            >
              {isSubmitting ? (
                "Envoi en cours..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le message
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}