import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Settings, MessageSquare, LogOut, Save, RefreshCw } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { queryClient } from "@/lib/queryClient";

// Configuration schema with validation
const configSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Maximum 100 caractères"),
  systemPrompt: z.string().min(10, "Le prompt système doit contenir au moins 10 caractères").max(2000, "Maximum 2000 caractères"),
  model: z.string().min(1, "Le modèle est requis"),
  maxTokens: z.coerce.number().int().min(128, "Minimum 128 tokens").max(8192, "Maximum 8192 tokens"),
  temperature: z.coerce.number().min(0, "Minimum 0").max(2, "Maximum 2"),
  maxHistoryMessages: z.coerce.number().int().min(0, "Minimum 0").max(20, "Maximum 20 messages"),
  isActive: z.boolean(),
  welcomeMessage: z.string().min(1, "Le message de bienvenue est requis").max(500, "Maximum 500 caractères"),
});

type ConfigFormData = z.infer<typeof configSchema>;

// Type for config from API
type ChatConfig = {
  name?: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number | string;
  temperature?: number | string;
  maxHistoryMessages?: number | string;
  isActive?: boolean;
  welcomeMessage?: string;
};

// Available models
const AVAILABLE_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Rapide et économique)" },
  { value: "gpt-4o", label: "GPT-4o (Performant)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo (Équilibré)" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Économique)" },
];

export default function AdminChatConfigPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.authenticated) {
          setLocation("/admin/login");
          return;
        }
      } catch (error) {
        setLocation("/admin/login");
        return;
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  // Fetch current configuration
  const { data: config, isLoading: isLoadingConfig, error: configError } = useQuery<ChatConfig>({
    queryKey: ['/api/chat-config'],
    enabled: !isAuthChecking,
  });

  // Form setup
  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      name: "Configuration principale",
      systemPrompt: "Vous êtes un assistant expert en immobilier spécialisé dans la région de Gironde/Bordeaux. Vous aidez les utilisateurs avec leurs questions sur l'estimation immobilière, le marché local, et les conseils pour vendre ou acheter. Soyez professionnel, précis et utilisez votre expertise du marché français.",
      model: "gpt-4o-mini",
      maxTokens: 2048,
      temperature: 0.7,
      maxHistoryMessages: 6,
      isActive: true,
      welcomeMessage: "Bonjour ! Je suis votre assistant immobilier spécialisé dans la région Gironde/Bordeaux. Comment puis-je vous aider avec votre projet immobilier ?",
    },
  });

  // Update form when config is loaded
  useEffect(() => {
    if (config) {
      form.reset({
        name: config.name || "Configuration principale",
        systemPrompt: config.systemPrompt || "",
        model: config.model || "gpt-4o-mini",
        maxTokens: Number(config.maxTokens) || 2048,
        temperature: typeof config.temperature === 'string' ? parseFloat(config.temperature) : config.temperature || 0.7,
        maxHistoryMessages: Number(config.maxHistoryMessages) || 6,
        isActive: Boolean(config.isActive),
        welcomeMessage: config.welcomeMessage || "",
      });
    }
  }, [config, form]);

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      const response = await fetch('/api/chat-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration mise à jour",
        description: "Les paramètres du chat ont été sauvegardés avec succès."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chat-config'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Logout function
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setLocation("/admin/login");
    } catch (error) {
      console.error('Logout error:', error);
      setLocation("/admin/login");
    }
  };

  const onSubmit = (data: ConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  // Loading state
  if (isAuthChecking || isLoadingConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (configError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Erreur de chargement</CardTitle>
            <CardDescription>
              Impossible de charger la configuration. Veuillez actualiser la page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Actualiser
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Configuration Chat IA - Administration | Estimation Immobilière"
        description="Configuration des paramètres du chat IA pour l'assistance immobilière."
        robots="noindex, nofollow"
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Administration</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            {/* Page header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Configuration du Chat IA</h2>
              </div>
              <p className="text-muted-foreground">
                Configurez les paramètres de l'assistant immobilier intelligent pour optimiser l'expérience utilisateur.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Paramètres du Chat</CardTitle>
                <CardDescription>
                  Modifiez le comportement et les réponses de l'assistant IA selon vos besoins.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom de la configuration</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-config-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Chat actif</FormLabel>
                              <FormDescription>
                                Active ou désactive le chat sur le site
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-is-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* AI Model Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Paramètres du modèle IA</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modèle IA</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-model">
                                    <SelectValue placeholder="Sélectionner un modèle" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {AVAILABLE_MODELS.map((model) => (
                                    <SelectItem key={model.value} value={model.value}>
                                      {model.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Le modèle IA à utiliser pour les réponses
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxTokens"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tokens maximum</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="128"
                                  max="8192"
                                  {...field}
                                  data-testid="input-max-tokens"
                                />
                              </FormControl>
                              <FormDescription>
                                Longueur maximale des réponses (128-8192)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Température</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="2"
                                  {...field}
                                  data-testid="input-temperature"
                                />
                              </FormControl>
                              <FormDescription>
                                Créativité des réponses (0-2)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="maxHistoryMessages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Messages d'historique maximum</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                className="max-w-xs"
                                {...field}
                                data-testid="input-max-history"
                              />
                            </FormControl>
                            <FormDescription>
                              Nombre de messages précédents à conserver dans le contexte (0-20)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Messages */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Messages et prompts</h3>
                      
                      <FormField
                        control={form.control}
                        name="welcomeMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message de bienvenue</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Message affiché lors de l'ouverture du chat..."
                                className="resize-none"
                                rows={3}
                                {...field}
                                data-testid="textarea-welcome-message"
                              />
                            </FormControl>
                            <FormDescription>
                              Premier message que voit l'utilisateur (max 500 caractères)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="systemPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prompt système</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Instructions pour l'IA sur son rôle et comportement..."
                                className="resize-none"
                                rows={8}
                                {...field}
                                data-testid="textarea-system-prompt"
                              />
                            </FormControl>
                            <FormDescription>
                              Instructions détaillées pour définir le comportement de l'IA (max 2000 caractères)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit button */}
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateConfigMutation.isPending}
                        data-testid="button-save-config"
                      >
                        {updateConfigMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Sauvegarder la configuration
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}