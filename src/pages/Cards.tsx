import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Brain, Star, Search, Filter, MoreVertical, Edit, Trash2 } from "lucide-react";
import { CreateCardDialog } from "@/components/CreateCardDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { showError, showSuccess } from "@/utils/toast";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { DialogTrigger } from '@/components/ui/dialog';

const CardsPage = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'deck' | 'topic' | 'tags'>('none');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      if (!session?.user) return [];
      const { data, error } = await supabase
        .from('cards')
        .select(`
          id,
          front,
          back,
          topic,
          difficulty,
          created_at,
          deck:decks(id, title, color),
          card_tags(tag:tags(id, name, color))
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user,
  });

  const { data: decks } = useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      if (!session?.user) return [];
      const { data, error } = await supabase
        .from('decks')
        .select('id, title, color')
        .eq('user_id', session.user.id)
        .order('title');
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user,
  });

  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);
      
      if (error) throw error;
      showSuccess(t('toasts.cardDeleted'));
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    } catch (error: any) {
      showError(error.message);
    }
  };

  // Filter cards based on search and selections
  const filteredCards = cards?.filter(card => {
    const matchesSearch = searchTerm === '' || 
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDeck = selectedDeck === 'all' || card.deck?.id === selectedDeck;
    const matchesTopic = selectedTopic === 'all' || card.topic === selectedTopic;
    
    return matchesSearch && matchesDeck && matchesTopic;
  }) || [];

  // Get unique topics for filtering
  const topics = [...new Set(cards?.map(card => card.topic).filter(Boolean))] || [];

  // Group cards based on selection
  const groupedCards = () => {
    if (groupBy === 'none') return { [t('cardsPage.allCards')]: filteredCards };
    
    const groups: Record<string, typeof filteredCards> = {};
    
    filteredCards.forEach(card => {
      let groupKey = t('cardsPage.ungrouped');
      
      if (groupBy === 'deck' && card.deck) {
        groupKey = card.deck.title;
      } else if (groupBy === 'topic' && card.topic) {
        groupKey = card.topic;
      } else if (groupBy === 'tags') {
        const tags = card.card_tags?.map(ct => ct.tag?.name).filter(Boolean) || [];
        groupKey = tags.length > 0 ? tags.join(', ') : t('cardsPage.noTags');
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(card);
    });
    
    return groups;
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
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
            {t('cardsPage.title')}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t('cardsPage.description')}
          </p>
        </div>
        <CreateCardDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Plus className="h-4 w-4 mr-2" />
              {t('cardDialog.trigger')}
            </Button>
          </DialogTrigger>
        </CreateCardDialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('cardsPage.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedDeck} onValueChange={setSelectedDeck}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('cardsPage.filterByDeck')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cardsPage.allDecks')}</SelectItem>
            {decks?.map((deck) => (
              <SelectItem key={deck.id} value={deck.id}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deck.color }} />
                  {deck.title}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('cardsPage.filterByTopic')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cardsPage.allTopics')}</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic} value={topic}>
                {topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('cardsPage.noGrouping')}</SelectItem>
            <SelectItem value="deck">{t('cardsPage.groupByDeck')}</SelectItem>
            <SelectItem value="topic">{t('cardsPage.groupByTopic')}</SelectItem>
            <SelectItem value="tags">{t('cardsPage.groupByTags')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCards.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedCards()).map(([groupName, groupCards]) => (
            <div key={groupName} className="space-y-4">
              {groupBy !== 'none' && (
                <h3 className="text-xl font-semibold text-foreground/80">
                  {groupName} ({groupCards.length})
                </h3>
              )}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groupCards.map((card) => (
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
                              <Link to={`/cards/${card.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('cardsPage.viewDetails')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCard(card.id);
                              }}
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
                      <Link to={`/cards/${card.id}`}>
                        <div className="space-y-2">
                          {card.deck && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.deck.color }} />
                              <span className="text-sm text-muted-foreground">{card.deck.title}</span>
                            </div>
                          )}
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
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="h-16 w-16 text-primary/60 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm || selectedDeck !== 'all' || selectedTopic !== 'all' 
                ? t('cardsPage.emptyFilteredTitle')
                : t('cardsPage.emptyTitle')
              }
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {searchTerm || selectedDeck !== 'all' || selectedTopic !== 'all'
                ? t('cardsPage.emptyFilteredDescription')
                : t('cardsPage.emptyDescription')
              }
            </p>
            <CreateCardDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('cardDialog.trigger')}
                </Button>
              </DialogTrigger>
            </CreateCardDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CardsPage;