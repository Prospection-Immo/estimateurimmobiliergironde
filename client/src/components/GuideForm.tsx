import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertGuideSchema, GUIDE_PERSONAS, type Guide, type InsertGuide } from "@shared/schema";
import { z } from "zod";
import { Plus, X, Save, Loader2 } from "lucide-react";

// Extend the schema for form validation
const guideFormSchema = insertGuideSchema.extend({
  keywords: z.array(z.string()).default([]),
  targetAudience: z.array(z.string()).default([])
});

type GuideFormData = z.infer<typeof guideFormSchema>;

interface GuideFormProps {
  guide?: Guide;
  isOpen: boolean;
  onClose: () => void;
}

export default function GuideForm({ guide, isOpen, onClose }: GuideFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [keywordInput, setKeywordInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");

  const form = useForm<GuideFormData>({
    resolver: zodResolver(guideFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      content: "",
      persona: "presse",
      status: "draft",
      keywords: [],
      targetAudience: [],
      estimatedReadTime: 5
    }
  });

  // Reset form when guide changes
  useEffect(() => {
    if (guide) {
      form.reset({
        title: guide.title,
        slug: guide.slug,
        description: guide.description,
        content: guide.content,
        persona: guide.persona,
        status: guide.status,
        keywords: guide.keywords || [],
        targetAudience: guide.targetAudience || [],
        estimatedReadTime: guide.estimatedReadTime
      });
    } else {
      form.reset({
        title: "",
        slug: "",
        description: "",
        content: "",
        persona: "presse",
        status: "draft",
        keywords: [],
        targetAudience: [],
        estimatedReadTime: 5
      });
    }
  }, [guide, form]);

  // Auto-generate slug from title
  const watchTitle = form.watch("title");
  useEffect(() => {
    if (watchTitle && !guide) { // Only auto-generate for new guides
      const slug = watchTitle
        .toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      form.setValue("slug", slug);
    }
  }, [watchTitle, form, guide]);

  const createMutation = useMutation({
    mutationFn: (data: InsertGuide) => apiRequest('/api/admin/guides', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/guides'] });
      toast({
        title: "Succès",
        description: "Le guide a été créé avec succès"
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du guide",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertGuide>) => apiRequest(`/api/admin/guides/${guide?.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/guides'] });
      toast({
        title: "Succès",
        description: "Le guide a été mis à jour avec succès"
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du guide",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: GuideFormData) => {
    if (guide) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      const currentKeywords = form.getValues("keywords");
      if (!currentKeywords.includes(keywordInput.trim())) {
        form.setValue("keywords", [...currentKeywords, keywordInput.trim()]);
      }
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("keywords");
    form.setValue("keywords", currentKeywords.filter(k => k !== keyword));
  };

  const addAudience = () => {
    if (audienceInput.trim()) {
      const currentAudience = form.getValues("targetAudience");
      if (!currentAudience.includes(audienceInput.trim())) {
        form.setValue("targetAudience", [...currentAudience, audienceInput.trim()]);
      }
      setAudienceInput("");
    }
  };

  const removeAudience = (audience: string) => {
    const currentAudience = form.getValues("targetAudience");
    form.setValue("targetAudience", currentAudience.filter(a => a !== audience));
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-guide-form">
        <DialogHeader>
          <DialogTitle data-testid="text-guide-form-title">
            {guide ? "Modifier le guide" : "Créer un nouveau guide"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre du guide</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Comment vendre rapidement en Gironde..." 
                          data-testid="input-guide-title"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="comment-vendre-rapidement-gironde" 
                          data-testid="input-guide-slug"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="persona"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persona cible</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-guide-persona">
                            <SelectValue placeholder="Sélectionner un persona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GUIDE_PERSONAS.map((persona) => (
                            <SelectItem key={persona} value={persona}>
                              {persona.charAt(0).toUpperCase() + persona.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-guide-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                          <SelectItem value="archived">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedReadTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temps de lecture estimé (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="60" 
                          data-testid="input-guide-read-time"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Keywords and Audience */}
              <div className="space-y-4">
                <div>
                  <Label>Mots-clés</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Ajouter un mot-clé"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      data-testid="input-guide-keyword"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={addKeyword}
                      data-testid="button-add-keyword"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch("keywords").map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                        {keyword}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeKeyword(keyword)}
                          data-testid={`button-remove-keyword-${keyword}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Audience cible</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Ex: Propriétaires de maisons"
                      value={audienceInput}
                      onChange={(e) => setAudienceInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAudience())}
                      data-testid="input-guide-audience"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={addAudience}
                      data-testid="button-add-audience"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch("targetAudience").map((audience) => (
                      <Badge key={audience} variant="secondary" className="flex items-center gap-1">
                        {audience}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeAudience(audience)}
                          data-testid={`button-remove-audience-${audience}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description courte</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description qui apparaîtra dans les listes et méta-descriptions..."
                      rows={3}
                      data-testid="textarea-guide-description"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu du guide</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Le contenu complet du guide en HTML ou Markdown..."
                      rows={12}
                      data-testid="textarea-guide-content"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-save-guide"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {guide ? "Mettre à jour" : "Créer le guide"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}