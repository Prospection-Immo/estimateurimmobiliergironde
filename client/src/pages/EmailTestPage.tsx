import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, CheckCircle2, AlertCircle, Wifi, WifiOff } from "lucide-react";

export default function EmailTestPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  const { toast } = useToast();

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await apiRequest('/api/dev/emails/test-connection', {
        method: 'POST'
      });
      
      if (response.success) {
        setConnectionStatus('success');
        toast({
          title: "✅ Connexion SMTP réussie",
          description: "Le serveur email est opérationnel",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "❌ Échec de connexion SMTP",
          description: response.details || "Erreur de connexion au serveur",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "❌ Erreur de connexion",
        description: "Impossible de tester la connexion SMTP",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const sendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir une adresse email",
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmail(true);
    try {
      const response = await apiRequest('/api/dev/emails/test', {
        method: 'POST',
        body: { email, name }
      });
      
      if (response.success) {
        toast({
          title: "🎉 Email envoyé avec succès !",
          description: `Email de test envoyé à ${email}`,
        });
        
        // Réinitialiser le formulaire
        setEmail("");
        setName("");
      } else {
        toast({
          title: "❌ Échec d'envoi",
          description: response.details || "Erreur lors de l'envoi de l'email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erreur d'envoi",
        description: "Impossible d'envoyer l'email de test",
        variant: "destructive",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Test d'emails - Développement</h1>
              <p className="text-muted-foreground">Interface de test pour vérifier l'envoi d'emails</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Test de connexion SMTP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {connectionStatus === 'success' ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : connectionStatus === 'error' ? (
                  <WifiOff className="h-5 w-5 text-red-500" />
                ) : (
                  <Wifi className="h-5 w-5 text-muted-foreground" />
                )}
                Test de connexion SMTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vérifiez que le serveur SMTP est accessible et configuré correctement.
              </p>
              
              {connectionStatus === 'success' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700 dark:text-green-300">Connexion SMTP active</span>
                </div>
              )}
              
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">Échec de connexion SMTP</span>
                </div>
              )}
              
              <Button 
                onClick={testConnection}
                disabled={isTestingConnection}
                className="w-full"
                data-testid="button-test-connection"
              >
                {isTestingConnection ? "Test en cours..." : "Tester la connexion"}
              </Button>
            </CardContent>
          </Card>

          {/* Envoi d'email de test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Envoi d'email de test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Adresse email de destination *</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-test-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test-name">Nom du destinataire (optionnel)</Label>
                <Input
                  id="test-name"
                  type="text"
                  placeholder="Nom du destinataire"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-test-name"
                />
              </div>
              
              <Button 
                onClick={sendTestEmail}
                disabled={isTestingEmail || !email}
                className="w-full"
                data-testid="button-send-test"
              >
                {isTestingEmail ? "Envoi en cours..." : "Envoyer l'email de test"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 Informations sur le test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Serveur SMTP :</strong> O2Switch (bus.o2switch.net)
              </div>
              <div>
                <strong>Mode :</strong> Développement (sans authentification)
              </div>
              <div>
                <strong>Expéditeur :</strong> admin@estimation-immobilier-gironde.fr
              </div>
              <div>
                <strong>Sujet :</strong> Test Email - Système de notification
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                <strong>Note :</strong> Cette interface est uniquement disponible en mode développement. 
                L'email de test contient des informations sur le système et confirme le bon fonctionnement de l'envoi d'emails.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}