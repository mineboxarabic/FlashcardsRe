import { useEffect, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showError, showSuccess } from '@/utils/toast';
import { Zap } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const quickCardSchema = z.object({
  front: z.string().min(1, 'Question is required'),
  back: z.string().min(1, 'Answer is required'),
});

type QuickCardValues = z.infer<typeof quickCardSchema>;

interface QuickCreateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
}

export const QuickCreateCardDialog = ({ open, onOpenChange, children }: QuickCreateCardDialogProps) => {
  const { t } = useTranslation();
  const { session } = useSession();
  const queryClient = useQueryClient();

  const form = useForm<QuickCardValues>({
    resolver: zodResolver(quickCardSchema),
    defaultValues: {
      front: '',
      back: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: QuickCardValues) => {
    try {
      if (!session?.user) throw new Error('User not logged in');
      
      const { error } = await supabase
        .from('cards')
        .insert({
          ...values,
          user_id: session.user.id,
          difficulty: 1,
        });

      if (error) throw error;
      
      showSuccess('Card created successfully!');
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t('quickCardDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('quickCardDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('quickCardDialog.frontLabel')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('quickCardDialog.frontPlaceholder')}
                      className="resize-none"
                      rows={3}
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
                  <FormLabel>{t('quickCardDialog.backLabel')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('quickCardDialog.backPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('quickCardDialog.cancelButton')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('quickCardDialog.submittingButton') : t('quickCardDialog.submitButton')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};