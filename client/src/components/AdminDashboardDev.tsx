import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { 
  Users, 
  Calculator, 
  Phone, 
  TrendingUp, 
  Mail,
  Settings,
  TestTube,
  BarChart3,
  Home,
  Grid3X3
} from "lucide-react";

interface Props {
  domain: string;
}

export default function AdminDashboardDev({ domain }: Props) {
  const [activeTab, setActiveTab] = useState("overview");

  const handleSectionChange = (section: string) => {
    setActiveTab(section);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AdminSidebar 
          activeSection={activeTab}
          onSectionChange={handleSectionChange}
        />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h1 className="font-semibold">
                  🚀 Administration - Mode Développement
                </h1>
              </div>
              <Badge variant="outline" className="bg-orange-100 text-orange-700">
                DEV MODE
              </Badge>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Aperçu
                </TabsTrigger>
                <TabsTrigger value="leads" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Leads
                </TabsTrigger>
                <TabsTrigger value="estimations" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Estimations
                </TabsTrigger>
                <TabsTrigger value="emails" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Emails
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="tests" className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Tests
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Mode Développement
                      </CardTitle>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">ACTIF</div>
                      <p className="text-xs text-muted-foreground">
                        Accès sans authentification
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Leads Simulés
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">--</div>
                      <p className="text-xs text-muted-foreground">
                        Base de données non connectée
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Emails Test
                      </CardTitle>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">✓</div>
                      <p className="text-xs text-muted-foreground">
                        Système opérationnel
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Fonctionnalités
                      </CardTitle>
                      <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">6</div>
                      <p className="text-xs text-muted-foreground">
                        Sections disponibles
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">📧 Test d'Emails</h3>
                    <p className="text-muted-foreground mb-4">
                      Interface dédiée pour tester l'envoi d'emails en développement.
                    </p>
                    <Button asChild className="w-full">
                      <a href="/email-test" target="_blank">
                        Ouvrir l'interface de test
                      </a>
                    </Button>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">🏠 Site Public</h3>
                    <p className="text-muted-foreground mb-4">
                      Accéder au site public pour tester les fonctionnalités client.
                    </p>
                    <Button variant="outline" asChild className="w-full">
                      <a href="/" target="_blank">
                        Voir le site public
                      </a>
                    </Button>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">⚠️ Mode Développement Actif</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">✓</Badge>
                      <span>Authentification désactivée</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">✓</Badge>
                      <span>Interface d'administration accessible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">✓</Badge>
                      <span>Système d'emails opérationnel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">⚠</Badge>
                      <span>Base de données en cours de configuration</span>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="leads">
                <Card className="p-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Section Leads</h3>
                    <p className="text-muted-foreground">
                      Cette section sera disponible une fois la base de données configurée.
                    </p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="estimations">
                <Card className="p-6">
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Section Estimations</h3>
                    <p className="text-muted-foreground">
                      Cette section sera disponible une fois la base de données configurée.
                    </p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="emails">
                <Card className="p-6">
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Système d'Emails</h3>
                    <p className="text-muted-foreground mb-4">
                      Le système d'emails est opérationnel. Utilisez l'interface de test pour envoyer des emails.
                    </p>
                    <Button asChild>
                      <a href="/email-test" target="_blank">
                        Interface de Test d'Emails
                      </a>
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="p-6">
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                    <p className="text-muted-foreground">
                      Les analytics seront disponibles une fois la base de données configurée.
                    </p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="tests">
                <Card className="p-6">
                  <div className="text-center py-12">
                    <TestTube className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Outils de Test</h3>
                    <p className="text-muted-foreground mb-4">
                      Accédez aux différents outils de test disponibles en développement.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button asChild variant="outline">
                        <a href="/email-test" target="_blank">
                          Test Emails
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href="/" target="_blank">
                          Site Public
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}