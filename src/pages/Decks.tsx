import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Users, Clock, MoreVertical, Edit, Trash2 } from "lucide-react";
import { CreateDeckDialog } from "@/components/CreateDeckDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { showError, showSuccess } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DialogTrigger } from "@/components/ui/dialog";

const DecksPage = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: decks, isLoading } = useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      if (!session?.user) return [];
      const { data, error } = await supabase
        .from('decks')
        .select(`
          id,
          title,
          description,
          color,
          created_at,
          cards:cards(count)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user,
  });

  const deleteDeck = async (deckId: string) => {
    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);
      
      if (error) throw error;
      showSuccess(t('toasts.deckDeleted'));
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('decksPage.title')}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t('decksPage.description')}
          </p>
        </div>
        <CreateDeckDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Plus className="h-4 w-4 me-2" />
              {t('dashboard.createDeck')}
            </Button>
          </DialogTrigger>
        </CreateDeckDialog>
      </div>

      {decks && decks.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card 
              key={deck.id}
              className="hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: deck.color }}
                    />
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/decks/${deck.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('decksPage.viewDetails')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDeck(deck.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('decksPage.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link to={`/decks/${deck.id}`}>
                  <CardTitle className="text-lg hover:text-primary transition-colors duration-200">
                    {deck.title}
                  </CardTitle>
                  {deck.description && (
                    <CardDescription>{deck.description}</CardDescription>
                  )}
                </Link>
              </CardHeader>
              <CardContent>
                <Link to={`/decks/${deck.id}`}>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{t('decksPage.cards', { count: deck.cards?.[0]?.count || 0 })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(deck.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-16 w-16 text-primary/60 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('decksPage.emptyTitle')}</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {t('decksPage.emptyDescription')}
            </p>
            <CreateDeckDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="h-4 w-4 me-2" />
                  {t('dashboard.createDeck')}
                </Button>
              </DialogTrigger>
            </CreateDeckDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DecksPage;