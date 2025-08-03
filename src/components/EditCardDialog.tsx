import { useState, useEffect, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showError, showSuccess } from '@/utils/toast';
import { Edit } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const cardFormSchema = z.object({
  front: z.string().min(1, 'Front side is required'),
  back: z.string().min(1, 'Back side is required'),
  deck_id: z.string().optional(),
  topic: z.string().max(100, 'Topic must be less than 100 characters').optional(),
  difficulty: z.number().min(1).max(5),
});

type CardFormValues = z.infer<typeof cardFormSchema>;

interface CardToEdit {
  id: string;
  front: string;
  back: string;
  topic: string | null;
  difficulty: number;
  deck: { id: string; } | null;
  card_tags: Array<{ tag: { id: string; name: string; color: string } | null }>;
}

interface EditCardDialogProps {
  card: CardToEdit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
}

export const EditCardDialog = ({ card, open, onOpenChange, children }: EditCardDialogProps) => {
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const { session } = useSession();
  const queryClient = useQueryClient();

  const { data: decks } = useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      if (!session?.user) return [];
      const { data, error } = await supabase
        .from('decks')
        .select('id, title, color')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      if (!session?.user) return [];
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('user_id', session.user.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user,
  });

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      front: '',
      back: '',
      deck_id: '',
      topic: '',
      difficulty: 1,
    },
  });

  useEffect(() => {
    if (open && card) {
      form.reset({
        front: card.front,
        back: card.back,
        deck_id: card.deck?.id || '',
        topic: card.topic || '',
        difficulty: card.difficulty,
      });
      setSelectedTags(card.card_tags.map(ct => ct.tag?.id).filter((id): id is string => !!id));
    }
  }, [open, card, form]);

  const addTag = async () => {
    if (!newTag.trim() || !session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: newTag.trim(),
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSelectedTags([...selectedTags, data.id]);
      setNewTag('');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    } catch (error: any) {
      showError(error.message);
    }
  };

  const onSubmit = async (values: CardFormValues) => {
    try {
      if (!session?.user) throw new Error('User not logged in');
      
      const { error: cardError } = await supabase
        .from('cards')
        .update({
          ...values,
          deck_id: values.deck_id === '_none_' ? null : values.deck_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', card.id);

      if (cardError) throw cardError;

      const { error: deleteError } = await supabase
        .from('card_tags')
        .delete()
        .eq('card_id', card.id);
      
      if (deleteError) throw deleteError;

      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tagId => ({
          card_id: card.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from('card_tags')
          .insert(tagInserts);

        if (tagError) throw tagError;
      }
      
      showSuccess('Card updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['card', card.id] });
      if (card.deck?.id) {
        queryClient.invalidateQueries({ queryKey: ['deck-cards', card.deck.id] });
      }
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {t('editCardDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('editCardDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cardDialog.frontLabel')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('cardDialog.frontPlaceholder')}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cardDialog.backLabel')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('cardDialog.backPlaceholder')}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deck_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cardDialog.deckLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || '_none_'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('cardDialog.deckPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none_">{t('cardDialog.noDeck')}</SelectItem>
                        {decks?.map((deck) => (
                          <SelectItem key={deck.id} value={deck.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: deck.color }}
                              />
                              {deck.title}
                            </div>
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
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cardDialog.difficultyLabel')}</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            {'★'.repeat(level) + '☆'.repeat(5 - level)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cardDialog.topicLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('cardDialog.topicPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>{t('cardDialog.tagsLabel')}</FormLabel>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder={t('cardDialog.newTagPlaceholder')}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  {t('cardDialog.addTagButton')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag.id) 
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('cardDialog.cancelButton')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('cardDialog.submittingButton') : t('cardDialog.submitButton')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};