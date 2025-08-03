import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, Calendar, Target, TrendingUp, BookOpen, Tag, Brain, RotateCcw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { useTranslation } from 'react-i18next';
import { EditCardDialog } from '@/components/EditCardDialog';

const CardDetails = () => {
  const { cardId } = useParams();
  const { session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showAnswer, setShowAnswer] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      if (!session?.user || !cardId) return null;
      const { data, error } = await supabase
        .from('cards')
        .select(`
          *,
          deck:decks(id, title, color),
          card_tags(tag:tags(id, name, color))
        `)
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user && !!cardId,
  });

  const deleteCard = async () => {
    if (!cardId) return;
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);
      
      if (error) throw error;
      showSuccess(t('toasts.cardDeleted'));
      navigate('/cards');
    } catch (error: any) {
      showError(error.message);
    }
  };

  const resetCardProgress = async () => {
    if (!cardId) return;
    try {
      const { error } = await supabase
        .from('cards')
        .update({
          review_count: 0,
          correct_count: 0,
          last_reviewed: null,
        })
        .eq('id', cardId);
      
      if (error) throw error;
      showSuccess(t('toasts.cardProgressReset'));
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-2xl font-bold mb-4">{t('cardDetailsPage.notFound')}</h2>
        <Link to="/cards">
          <Button>{t('cardDetailsPage.backToCards')}</Button>
        </Link>
      </div>
    );
  }

  const accuracy = card.review_count > 0 ? Math.round((card.correct_count / card.review_count) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-700">
        <div className="flex items-center gap-4">
          <Link to="/cards">
            <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform duration-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('cardDetailsPage.backToCards')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('cardDetailsPage.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('cardDetailsPage.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetCardProgress}
            className="hover:scale-105 transition-transform duration-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('cardDetailsPage.resetProgress')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('cardDetailsPage.edit')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={deleteCard}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('cardDetailsPage.delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Card Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Preview */}
          <Card className="animate-in fade-in slide-in-from-left duration-700 delay-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {t('cardDetailsPage.previewTitle')}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  {showAnswer ? t('cardDetailsPage.showQuestion') : t('cardDetailsPage.showAnswer')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Side */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-muted-foreground">
                  {showAnswer ? t('cardDetailsPage.questionLabel') : t('cardDetailsPage.frontSideLabel')}
                </h3>
                <div className={`p-6 rounded-lg transition-all duration-300 ${
                  !showAnswer ? 'bg-primary/10 border-2 border-primary/20' : 'bg-secondary/30'
                }`}>
                  <p className="text-lg leading-relaxed">{card.front}</p>
                </div>
              </div>

              {/* Answer Side */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-muted-foreground">
                  {showAnswer ? t('cardDetailsPage.answerLabel') : t('cardDetailsPage.backSideLabel')}
                </h3>
                <div className={`p-6 rounded-lg transition-all duration-300 ${
                  showAnswer 
                    ? 'bg-primary/10 border-2 border-primary/20' 
                    : 'bg-muted/50 border-2 border-dashed border-muted-foreground/20'
                }`}>
                  {showAnswer ? (
                    <p className="text-lg leading-relaxed animate-in fade-in duration-300">
                      {card.back}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">{t('cardDetailsPage.revealPrompt')}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Statistics */}
          <Card className="animate-in fade-in slide-in-from-left duration-700 delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('cardDetailsPage.statsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{card.review_count}</div>
                  <div className="text-sm text-muted-foreground">{t('cardDetailsPage.totalReviews')}</div>
                </div>
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{card.correct_count}</div>
                  <div className="text-sm text-muted-foreground">{t('cardDetailsPage.correctAnswers')}</div>
                </div>
                <div className="text-center p-4 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
                  <div className="text-sm text-muted-foreground">{t('cardDetailsPage.accuracyRate')}</div>
                </div>
              </div>
              {card.last_reviewed && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {t('cardDetailsPage.lastReviewed', {
                      date: new Date(card.last_reviewed).toLocaleDateString(),
                      time: new Date(card.last_reviewed).toLocaleTimeString()
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Card Properties */}
          <Card className="animate-in fade-in slide-in-from-right duration-700 delay-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('cardDetailsPage.propertiesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('cardDetailsPage.difficulty')}</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {'★'.repeat(card.difficulty)}
                    {'☆'.repeat(5 - card.difficulty)}
                  </div>
                  <span className="text-sm text-muted-foreground">({card.difficulty}/5)</span>
                </div>
              </div>

              {card.topic && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('cardDetailsPage.topic')}</label>
                  <div className="mt-1">
                    <Badge variant="secondary">{card.topic}</Badge>
                  </div>
                </div>
              )}

              {card.deck && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('cardDetailsPage.deck')}</label>
                  <div className="mt-1">
                    <Link to={`/decks/${card.deck.id}`}>
                      <Badge 
                        variant="outline" 
                        className="hover:bg-secondary cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: card.deck.color }}
                          />
                          <BookOpen className="h-3 w-3" />
                          {card.deck.title}
                        </div>
                      </Badge>
                    </Link>
                  </div>
                </div>
              )}

              {card.card_tags && card.card_tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('cardDetailsPage.tags')}</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {card.card_tags.map((ct) => (
                      <Badge 
                        key={ct.tag?.id} 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: ct.tag?.color }}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {ct.tag?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('cardDetailsPage.created')}</label>
                <div className="text-sm mt-1">
                  {new Date(card.created_at).toLocaleDateString()} at {new Date(card.created_at).toLocaleTimeString()}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('cardDetailsPage.lastUpdated')}</label>
                <div className="text-sm mt-1">
                  {new Date(card.updated_at).toLocaleDateString()} at {new Date(card.updated_at).toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-in fade-in slide-in-from-right duration-700 delay-500">
            <CardHeader>
              <CardTitle>{t('cardDetailsPage.quickActionsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start hover:scale-105 transition-transform duration-200" 
                variant="outline"
              >
                <Brain className="h-4 w-4 mr-2" />
                {t('cardDetailsPage.studyThisCard')}
              </Button>
              <Button 
                className="w-full justify-start hover:scale-105 transition-transform duration-200" 
                variant="outline"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('cardDetailsPage.editCard')}
              </Button>
              {card.deck && (
                <Link to={`/decks/${card.deck.id}`}>
                  <Button 
                    className="w-full justify-start hover:scale-105 transition-transform duration-200" 
                    variant="outline"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t('cardDetailsPage.viewDeck')}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {card && (
        <EditCardDialog
          card={card}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </div>
  );
};

export default CardDetails;