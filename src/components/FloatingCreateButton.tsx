import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Zap, BookOpen, FileText } from 'lucide-react';
import { QuickCreateCardDialog } from './QuickCreateCardDialog';
import { CreateDeckDialog } from './CreateDeckDialog';
import { CreateCardDialog } from './CreateCardDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

export const FloatingCreateButton = () => {
  const [quickCardOpen, setQuickCardOpen] = useState(false);
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => setQuickCardOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              {t('floatingCreateButton.quickCard')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setCardDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              {t('floatingCreateButton.detailedCard')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDeckDialogOpen(true)}>
              <BookOpen className="h-4 w-4 mr-2" />
              {t('floatingCreateButton.newDeck')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <QuickCreateCardDialog open={quickCardOpen} onOpenChange={setQuickCardOpen} />
      <CreateCardDialog open={cardDialogOpen} onOpenChange={setCardDialogOpen} />
      <CreateDeckDialog open={deckDialogOpen} onOpenChange={setDeckDialogOpen} />
    </>
  );
};