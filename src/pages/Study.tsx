import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, Play, Settings, BookOpen, Target, Shuffle, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { StudySession } from '@/components/StudySession';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

const StudyPage = () => {
  const { session } = useSession();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [studyMode, setStudyMode] = useState<'due' | 'all' | 'deck' | 'topic' | 'difficulty'>('due');
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [isStudying, setIsStudying] = useState(false);
  const [studyCards, setStudyCards] = useState<any[]>([]);

  const { data: cards, isLoading: cardsLoading } = useQuery({
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
          review_count,
          correct_count,
          last_reviewed,
          interval,
          ease_factor,
          next_review_date,
          card_type,
          options,
          deck:decks(id, title, color),
          card_tags(tag:tags(id, name, color))
        `)
        .eq('user_id', session.user.id);
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

  const topics = [...new Set(cards?.map(card => card.topic).filter(Boolean))] || [];

  const getFilteredCards = () => {
    if (!cards) return [];
    
    let filtered = [...cards];
    const now = new Date();
    
    if (studyMode === 'due') {
      // Show cards that are due for review or have never been reviewed
      filtered = filtered.filter(card => 
        !card.next_review_date || new Date(card.next_review_date) <= now
      );
    } else if (studyMode === 'deck' && selectedDeck) {
      filtered = filtered.filter(card => card.deck?.id === selectedDeck);
    } else if (studyMode === 'topic' && selectedTopic) {
      filtered = filtered.filter(card => card.topic === selectedTopic);
    } else if (studyMode === 'difficulty' && selectedDifficulty) {
      filtered = filtered.filter(card => card.difficulty === parseInt(selectedDifficulty));
    }
    
    // Sort by priority: overdue cards first, then by interval
    return filtered.sort((a, b) => {
      const aOverdue = a.next_review_date ? new Date(a.next_review_date).getTime() - now.getTime() : -1;
      const bOverdue = b.next_review_date ? new Date(b.next_review_date).getTime() - now.getTime() : -1;
      
      if (aOverdue < 0 && bOverdue >= 0) return -1;
      if (bOverdue < 0 && aOverdue >= 0) return 1;
      
      return aOverdue - bOverdue;
    });
  };

  const startStudySession = () => {
    const filtered = getFilteredCards();
    setStudyCards(filtered);
    setIsStudying(true);
  };

  const endStudySession = () => {
    setIsStudying(false);
    setStudyCards([]);
    queryClient.invalidateQueries({ queryKey: ['cards'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const getStudyModeDescription = () => {
    switch (studyMode) {
      case 'due':
        return t('studyPage.configDescDue');
      case 'deck':
        return t('studyPage.configDescDeck');
      case 'topic':
        return t('studyPage.configDescTopic');
      case 'difficulty':
        return t('studyPage.configDescDifficulty');
      default:
        return t('studyPage.configDescAll');
    }
  };

  // Calculate study statistics
  const studyStats = cards ? {
    total: cards.length,
    due: cards.filter(card => !card.next_review_date || new Date(card.next_review_date) <= new Date()).length,
    new: cards.filter(card => card.review_count === 0).length,
    learning: cards.filter(card => card.review_count > 0 && card.interval < 21).length,
    mature: cards.filter(card => card.interval >= 21).length,
    overdue: cards.filter(card => card.next_review_date && new Date(card.next_review_date) < new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
  } : null;

  if (cardsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isStudying) {
    return <StudySession cards={studyCards} onComplete={endStudySession} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t('studyPage.title')}
        </h2>
        <p className="text-muted-foreground mt-2">
          {t('studyPage.description')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[
          { mode: 'due', icon: <Clock className="h-6 w-6" />, title: t('studyPage.modes.due'), desc: t('studyPage.modes.dueDesc'), count: studyStats?.due || 0 },
          { mode: 'all', icon: <Shuffle className="h-6 w-6" />, title: t('studyPage.modes.all'), desc: t('studyPage.modes.allDesc'), count: studyStats?.total || 0 },
          { mode: 'deck', icon: <BookOpen className="h-6 w-6" />, title: t('studyPage.modes.deck'), desc: t('studyPage.modes.deckDesc') },
          { mode: 'topic', icon: <Target className="h-6 w-6" />, title: t('studyPage.modes.topic'), desc: t('studyPage.modes.topicDesc') },
          { mode: 'difficulty', icon: <Brain className="h-6 w-6" />, title: t('studyPage.modes.difficulty'), desc: t('studyPage.modes.difficultyDesc') },
        ].map((option) => (
          <Card
            key={option.mode}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
              studyMode === option.mode 
                ? 'ring-2 ring-primary bg-primary/5' 
                : ''
            }`}
            onClick={() => setStudyMode(option.mode as any)}
          >
            <CardHeader className="text-center">
              <div className={`mx-auto p-3 rounded-full ${
                studyMode === option.mode ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              } transition-colors duration-200`}>
                {option.icon}
              </div>
              <CardTitle className="text-lg">{option.title}</CardTitle>
              <CardDescription>{option.desc}</CardDescription>
              {option.count !== undefined && (
                <Badge variant={studyMode === option.mode ? "default" : "secondary"} className="mt-2">
                  {option.count} cards
                </Badge>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('studyPage.configTitle')}
          </CardTitle>
          <CardDescription>{getStudyModeDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {studyMode === 'deck' && (
              <Select value={selectedDeck} onValueChange={setSelectedDeck}>
                <SelectTrigger>
                  <SelectValue placeholder={t('studyPage.selectDeck')} />
                </SelectTrigger>
                <SelectContent>
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
            )}

            {studyMode === 'topic' && (
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder={t('studyPage.selectTopic')} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {studyMode === 'difficulty' && (
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder={t('studyPage.selectDifficulty')} />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      {'★'.repeat(level) + '☆'.repeat(5 - level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {t('studyPage.cardsAvailable', { count: getFilteredCards().length })}
              </Badge>
              {studyStats && studyStats.overdue > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {studyStats.overdue} overdue
                </Badge>
              )}
            </div>
            <Button
              size="lg"
              onClick={startStudySession}
              disabled={getFilteredCards().length === 0}
              className="hover:scale-[1.02] transition-transform duration-200"
            >
              <Play className="h-5 w-5 me-2" />
              {t('studyPage.startSession')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {studyStats && studyStats.total > 0 && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{studyStats.total}</div>
              <div className="text-sm text-muted-foreground">{t('studyPage.stats.total')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{studyStats.due}</div>
              <div className="text-sm text-muted-foreground">{t('studyPage.stats.due')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{studyStats.new}</div>
              <div className="text-sm text-muted-foreground">{t('studyPage.stats.new')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{studyStats.learning}</div>
              <div className="text-sm text-muted-foreground">{t('studyPage.stats.learning')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{studyStats.mature}</div>
              <div className="text-sm text-muted-foreground">{t('studyPage.stats.mature')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{studyStats.overdue}</div>
              <div className="text-sm text-muted-foreground">{t('studyPage.stats.overdue')}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {(!cards || cards.length === 0) && (
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="h-16 w-16 text-primary/60 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('studyPage.noCardsTitle')}</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {t('studyPage.noCardsDescription')}
            </p>
            <Button asChild className="hover:scale-[1.02] transition-transform duration-200">
              <a href="/cards">{t('studyPage.createFirstCard')}</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudyPage;