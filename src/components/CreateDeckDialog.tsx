import { useState, useEffect, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showError, showSuccess } from '@/utils/toast';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const deckFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color'),
});

type DeckFormValues = z.infer<typeof deckFormSchema>;

const colors = [
  '#2DD4BF', '#14B8A6', '#0D9488', '#0F766E', 
  '#D4AF37', '#B8860B', '#DAA520', '#FFD700',
  '#059669', '#047857', '#065F46', '#064E3B'
];

interface CreateDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
}

export const CreateDeckDialog = ({ open, onOpenChange, children }: CreateDeckDialogProps) => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const form = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      title: '',
      description: '',
      color: '#2DD4BF',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: DeckFormValues) => {
    try {
      if (!session?.user) throw new Error('User not logged in');
      
      const { error } = await supabase
        .from('decks')
        .insert({
          ...values,
          user_id: session.user.id,
        });

      if (error) throw error;
      
      showSuccess('Deck created successfully!');
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="sm:max-w-[425px] animate-in fade-in slide-in-from-bottom duration-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('deckDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('deckDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('deckDialog.form.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('deckDialog.form.titlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('deckDialog.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('deckDialog.form.descriptionPlaceholder')}
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('deckDialog.form.color')}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                            field.value === color ? 'border-accent scale-110 ring-2 ring-accent/50' : 'border-border'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('deckDialog.form.cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('deckDialog.form.submitting') : t('deckDialog.form.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};