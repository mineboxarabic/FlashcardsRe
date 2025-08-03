import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Trash2, Plus, FileText, Search, Filter, Play, MoreVertical, Calendar, Target, TrendingUp } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { showError, showSuccess } from "@/utils/toast";
import { CreateCardDialog } from "@/components/CreateCardDialog";
import { useTranslation } from 'react-i18next';
import { DialogTrigger } from '@/components/ui/dialog';
import { EditDeckDialog } from '@/components/EditDeckDialog';

const DeckDetails = () => {
  const { deckId } = useParams();
  const { session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'difficulty' | 'topic'>('created');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: deck, isLoading: deckLoading } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: async () => {
      if (!session?.user || !deckId) return null;
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .eq('user_id', session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user && !!deckId,
  });

  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ['deck-cards', deckId],
    queryFn: async () => {
      if (!session?.user || !deckId) return [];
      const { data, error } = await supabase
        .from('cards')
        .select(`
          id,
          front,
          back,
          topic,
          difficulty,
          created_at,
          review_count,
          correct_count,
          last_reviewed,
          card_tags(tag:tags(id, name, color))
        `)
        .eq('user_id', session.user.id)
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user && !!deckId,
  });

  const deleteDeck = async () => {
    if (!deckId) return;
    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);
      
      if (error) throw error;
      showSuccess(t('toasts.deckDeleted'));
      navigate('/decks');
    } catch (error: any) {
      showError(error.message);
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);
      
      if (error) throw error;
      showSuccess(t('toasts.cardDeleted'));
      queryClient.invalidateQueries({ queryKey: ['deck-cards', deckId] });
    } catch (error: any) {
      showError(error.message);
    }
  };

  // Filter and sort cards
  const filteredAndSortedCards = cards?.filter(card => {
    const matchesSearch = searchTerm === '' || 
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'difficulty':
        return b.difficulty - a.difficulty;
      case 'topic':
        return (a.topic || '').localeCompare(b.topic || '');
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  }) || [];

  // Calculate deck statistics
  const deckStats = cards ? {
    totalCards: cards.length,
    studiedCards: cards.filter(c => c.review_count > 0).length,
    averageAccuracy: cards.length > 0 
      ? Math.round(cards.reduce((acc, card) => 
          acc + (card.review_count > 0 ? (card.correct_count / card.review_count) * 100 : 0), 0
        ) / cards.filter(c => c.review_count > 0).length || 0)
      : 0,
    averageDifficulty: cards.length > 0 
      ? Math.round(cards.reduce((acc, card) => acc + card.difficulty, 0) / cards.length * 10) / 10
      : 0,
  } : null;

  if (deckLoading || cardsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold mb-4">{t('deckDetailsPage.notFound')}</h2>
        <Link to="/decks">
          <Button>{t('deckDetailsPage.backToDecks')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/decks">
            <Button variant="ghost" size="sm" className="hover:scale-[1.02] transition-transform duration-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('deckDetailsPage.backToDecks')}
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div 
              className="w-6 h-6 rounded-full" 
              style={{ backgroundColor: deck.color }}
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {deck.title}
              </h1>
              {deck.description && (
                <p className="text-muted-foreground mt-1">{deck.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/study?deck=${deckId}`}>
            <Button className="hover:scale-[1.02] transition-transform duration-200">
              <Play className="h-4 w-4 mr-2" />
              {t('deckDetailsPage.studyDeck')}
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('deckDetailsPage.editDeck')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={deleteDeck}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('deckDetailsPage.deleteDeck')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Deck Statistics */}
      {deckStats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{deckStats.totalCards}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <FileText className="h-4 w-4" />
                {t('deckDetailsPage.stats.totalCards')}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{deckStats.studiedCards}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Target className="h-4 w-4" />
                {t('deckDetailsPage.stats.studied')}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{deckStats.averageAccuracy}%</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {t('deckDetailsPage.stats.avgAccuracy')}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{deckStats.averageDifficulty}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="h-4 w-4" />
                {t('deckDetailsPage.stats.avgDifficulty')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cards Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t('deckDetailsPage.cardsTitle')}</h2>
          <CreateCardDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Plus className="h-4 w-4 mr-2" />
                {t('cardDialog.trigger')}
              </Button>
            </DialogTrigger>
          </CreateCardDialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('deckDetailsPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">{t('deckDetailsPage.sortByCreated')}</SelectItem>
              <SelectItem value="difficulty">{t('deckDetailsPage.sortByDifficulty')}</SelectItem>
              <SelectItem value="topic">{t('deckDetailsPage.sortByTopic')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards Grid */}
        {filteredAndSortedCards.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedCards.map((card) => (
              <Card 
                key={card.id}
                className="hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex">
                        {'★'.repeat(card.difficulty)}
                        {'☆'.repeat(5 - card.difficulty)}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/cards/${card.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('cardsPage.viewDetails')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteCard(card.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('cardsPage.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Link to={`/cards/${card.id}`}>
                    <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors duration-200">
                      {card.front}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{card.back}</CardDescription>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {card.topic && (
                      <Badge variant="secondary" className="text-xs">
                        {card.topic}
                      </Badge>
                    )}
                    {card.card_tags && card.card_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.card_tags.map((ct) => (
                          <Badge 
                            key={ct.tag?.id} 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: ct.tag?.color }}
                          >
                            {ct.tag?.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t('deckDetailsPage.reviews', { count: card.review_count })}</span>
                      {card.review_count > 0 && (
                        <span>{t('deckDetailsPage.accuracy', { rate: Math.round((card.correct_count / card.review_count) * 100) })}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-16 w-16 text-primary/60 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? t('deckDetailsPage.emptySearchTitle') : t('deckDetailsPage.emptyDeckTitle')}
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                {searchTerm 
                  ? t('deckDetailsPage.emptySearchDescription')
                  : t('deckDetailsPage.emptyDeckDescription')
                }
              </p>
              {!searchTerm && (
                <CreateCardDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('cardDialog.trigger')}
                    </Button>
                  </DialogTrigger>
                </CreateCardDialog>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {deck && (
        <EditDeckDialog
          deck={deck}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </div>
  );
};

export default DeckDetails;