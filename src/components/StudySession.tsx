import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Eye, EyeOff, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { showError, showSuccess } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface StudyCard {
  id: string;
  front: string;
  back: string;
  difficulty: number;
  topic?: string;
  review_count: number;
  correct_count: number;
  interval: number;
  ease_factor: number;
  next_review_date?: string;
  last_reviewed?: string;
  deck?: { title: string; color: string };
  card_tags?: Array<{ tag: { name: string; color: string } }>;
  card_type: 'classic' | 'multiple_choice' | 'fill_in_the_blank' | 'type_the_answer';
  options?: string[];
}

interface StudySessionProps {
  cards: StudyCard[];
  onComplete: () => void;
}

export const StudySession = ({ cards, onComplete }: StudySessionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const { session } = useSession();
  const { t } = useTranslation();

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + (showAnswer ? 0.5 : 0)) / cards.length) * 100;

  // Get card type with fallback to 'classic' for older cards
  const cardType = currentCard?.card_type || 'classic';

  useEffect(() => {
    if (currentCard && cardType === 'multiple_choice' && currentCard.options) {
      // Shuffle the options for display
      setShuffledOptions([...currentCard.options].sort(() => Math.random() - 0.5));
    }
    // Reset state for new card
    setShowAnswer(false);
    setSelectedAnswer(null);
    setFillBlankAnswer('');
    setTypedAnswer('');
  }, [currentCard, cardType]);

  const calculateNextReview = (card: StudyCard, grade: number) => {
    let { interval, ease_factor, review_count, correct_count } = card;
    
    review_count += 1;

    if (grade < 2) { 
      interval = 1;
      ease_factor = Math.max(1.3, ease_factor - 0.20);
    } else {
      correct_count += 1;
      if (correct_count === 1) interval = 1;
      else if (correct_count === 2) interval = 6;
      else interval = Math.round(interval * ease_factor);

      const ease_adjustment = 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
      ease_factor += ease_adjustment;

      if (grade === 4) interval = Math.round(interval * 1.3);
      if (grade === 2) interval = Math.round(interval * 0.8);
    }

    ease_factor = Math.max(1.3, Math.min(2.5, ease_factor));
    interval = Math.max(1, Math.min(365, interval));

    const next_review_date = new Date();
    next_review_date.setDate(next_review_date.getDate() + interval);

    return {
      interval,
      ease_factor: Math.round(ease_factor * 100) / 100,
      review_count,
      correct_count,
      next_review_date: next_review_date.toISOString(),
      last_reviewed: new Date().toISOString(),
    };
  };

  const handleGrade = async (grade: number) => {
    if (!currentCard || !session?.user || isProcessing) return;
    setIsProcessing(true);

    try {
      const updates = calculateNextReview(currentCard, grade);
      
      const { error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', currentCard.id);

      if (error) throw error;

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        showSuccess(t('studySession.sessionFinished'));
        onComplete();
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMcSelect = (option: string) => {
    setSelectedAnswer(option);
    setShowAnswer(true);
  };

  const handleFillBlankCheck = () => {
    setShowAnswer(true);
  };

  const renderAnswerArea = () => {
    switch (cardType) {
      case 'multiple_choice':
        if (!shuffledOptions.length) {
          return (
            <div className="p-6 bg-red-500/10 border-2 border-red-500/20 rounded-lg">
              <p className="text-red-600">Error: No options available for this multiple choice question.</p>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shuffledOptions.map((option, index) => {
              const isCorrect = option === currentCard.back;
              const isSelected = selectedAnswer === option;
              return (
                <Button
                  key={`${option}-${index}`}
                  variant="outline"
                  className={cn(
                    "h-auto py-4 px-4 justify-start text-left whitespace-normal min-h-[60px]",
                    showAnswer && isCorrect && "border-green-500 bg-green-500/10 text-green-700",
                    showAnswer && isSelected && !isCorrect && "border-red-500 bg-red-500/10 text-red-700",
                    !showAnswer && "hover:bg-primary/5"
                  )}
                  onClick={() => !showAnswer && handleMcSelect(option)}
                  disabled={showAnswer}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                      showAnswer && isCorrect && "border-green-500 bg-green-500 text-white",
                      showAnswer && isSelected && !isCorrect && "border-red-500 bg-red-500 text-white",
                      !showAnswer && "border-muted-foreground"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {showAnswer && isCorrect && <Check className="h-5 w-5 text-green-600" />}
                    {showAnswer && isSelected && !isCorrect && <X className="h-5 w-5 text-red-600" />}
                  </div>
                </Button>
              );
            })}
          </div>
        );
      case 'fill_in_the_blank':
        const parts = currentCard.front.split('{{blank}}');
        return (
          <div className="space-y-4">
            <div className="p-6 bg-secondary/30 rounded-lg border-l-4 border-primary text-lg flex items-center flex-wrap gap-2">
              <span>{parts[0]}</span>
              <Input
                className="w-48 inline-block"
                value={fillBlankAnswer}
                onChange={(e) => setFillBlankAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !showAnswer && handleFillBlankCheck()}
                disabled={showAnswer}
                placeholder="Type your answer..."
              />
              <span>{parts[1]}</span>
            </div>
            {showAnswer && (
              <div className={`p-4 rounded-lg border-l-4 ${
                fillBlankAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase()
                  ? 'bg-green-500/10 border-green-500'
                  : 'bg-red-500/10 border-red-500'
              }`}>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Your Answer</p>
                    <p className="text-lg">{fillBlankAnswer || <span className="italic text-muted-foreground">No answer provided</span>}</p>
                  </div>
                  <div className="border-t border-border/50 pt-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Correct Answer</p>
                    <p className="text-lg">{currentCard.back}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'type_the_answer':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type your answer here..."
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !showAnswer && setShowAnswer(true)}
                disabled={showAnswer}
                className="flex-1"
              />
              {!showAnswer && (
                <Button onClick={() => setShowAnswer(true)} disabled={!typedAnswer.trim()}>
                  Check Answer
                </Button>
              )}
            </div>
            {showAnswer && (
              <div className={`p-4 rounded-lg border-l-4 ${
                  typedAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase()
                      ? 'bg-green-500/10 border-green-500'
                      : 'bg-red-500/10 border-red-500'
              }`}>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Your Answer</p>
                    <p className="text-lg">{typedAnswer || <span className="italic text-muted-foreground">No answer provided</span>}</p>
                  </div>
                  <div className="border-t border-border/50 pt-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Correct Answer</p>
                    <p className="text-lg">{currentCard.back}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'classic':
      default:
        return (
          <div className={`p-6 rounded-lg transition-all duration-300 ${
            showAnswer 
              ? 'bg-primary/10 border-2 border-primary/20 border-l-4 border-l-primary' 
              : 'bg-muted/50 border-2 border-dashed border-muted-foreground/20'
          }`}>
            {showAnswer ? (
              <p className="text-lg leading-relaxed animate-in fade-in duration-300">
                {currentCard.back}
              </p>
            ) : (
              <p className="text-muted-foreground italic">{t('studySession.revealPrompt')}</p>
            )}
          </div>
        );
    }
  };

  const renderGradingButtons = () => {
    if (!showAnswer) return null;

    let isCorrect = false;
    if (cardType === 'multiple_choice') {
      isCorrect = selectedAnswer === currentCard.back;
    } else if (cardType === 'fill_in_the_blank') {
      isCorrect = fillBlankAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();
    } else if (cardType === 'type_the_answer') {
      isCorrect = typedAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();
    }

    if (cardType === 'classic') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button size="lg" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 flex-col h-auto py-4 hover:scale-105 transition-all duration-200" onClick={() => handleGrade(1)} disabled={isProcessing}>
            <span className="font-semibold">{t('studySession.again')}</span>
            <span className="text-xs mt-1">{calculateNextReview(currentCard, 1).interval} {t('studySession.days')}</span>
          </Button>
          <Button size="lg" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600 flex-col h-auto py-4 hover:scale-105 transition-all duration-200" onClick={() => handleGrade(2)} disabled={isProcessing}>
            <span className="font-semibold">{t('studySession.hard')}</span>
            <span className="text-xs mt-1">{calculateNextReview(currentCard, 2).interval} {t('studySession.days')}</span>
          </Button>
          <Button size="lg" variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 flex-col h-auto py-4 hover:scale-105 transition-all duration-200" onClick={() => handleGrade(3)} disabled={isProcessing}>
            <span className="font-semibold">{t('studySession.good')}</span>
            <span className="text-xs mt-1">{calculateNextReview(currentCard, 3).interval} {t('studySession.days')}</span>
          </Button>
          <Button size="lg" variant="outline" className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 flex-col h-auto py-4 hover:scale-105 transition-all duration-200" onClick={() => handleGrade(4)} disabled={isProcessing}>
            <span className="font-semibold">{t('studySession.easy')}</span>
            <span className="text-xs mt-1">{calculateNextReview(currentCard, 4).interval} {t('studySession.days')}</span>
          </Button>
        </div>
      );
    }

    // For objective card types (multiple choice, fill in blank, type the answer)
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          {isCorrect ? <Check className="h-12 w-12 text-green-500 mx-auto mb-2" /> : <X className="h-12 w-12 text-red-500 mx-auto mb-2" />}
          <p className={`font-bold text-xl ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </p>
          {!isCorrect && (
            <p className="text-muted-foreground mt-2">
              Correct answer: <span className="font-medium">{currentCard.back}</span>
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <Button 
            size="lg" 
            onClick={() => handleGrade(isCorrect ? 3 : 1)} 
            disabled={isProcessing}
            className="hover:scale-105 transition-transform duration-200"
          >
            {isProcessing ? 'Processing...' : 'Next Card'}
          </Button>
        </div>
      </div>
    );
  };

  if (!currentCard) {
    return (
      <Card className="max-w-2xl mx-auto animate-in fade-in duration-500">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="h-16 w-16 text-primary/60 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('studySession.noCardsTitle')}</h3>
          <p className="text-muted-foreground">{t('studySession.noCardsDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-sm">
            {t('studySession.cardOf', { current: currentIndex + 1, total: cards.length })}
          </Badge>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {cardType.replace('_', ' ').toUpperCase()}
            </Badge>
            <Button variant="outline" size="sm" onClick={onComplete}>
              End Session
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="min-h-[400px] hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>Study Session</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {'★'.repeat(currentCard.difficulty)}
                {'☆'.repeat(5 - currentCard.difficulty)}
              </div>
              {currentCard.deck && (
                <Badge variant="outline" style={{ borderColor: currentCard.deck.color }}>
                  {currentCard.deck.title}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {cardType !== 'fill_in_the_blank' && (
              <>
                <h3 className="text-lg font-medium text-muted-foreground">{t('studySession.question')}</h3>
                <div className="p-6 bg-secondary/30 rounded-lg border-l-4 border-primary">
                  <p className="text-lg leading-relaxed">{currentCard.front}</p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-muted-foreground">{t('studySession.answer')}</h3>
              {cardType === 'classic' && (
                <Button variant="outline" size="sm" onClick={() => setShowAnswer(!showAnswer)}>
                  {showAnswer ? <EyeOff className="h-4 w-4 me-2" /> : <Eye className="h-4 w-4 me-2" />}
                  {showAnswer ? t('studySession.hideAnswer') : t('studySession.showAnswer')}
                </Button>
              )}
              {(cardType === 'fill_in_the_blank' || cardType === 'type_the_answer') && !showAnswer && (
                <Button variant="outline" size="sm" onClick={() => setShowAnswer(true)}>
                  Check Answer
                </Button>
              )}
            </div>
            {renderAnswerArea()}
          </div>

          {showAnswer && (
            <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom duration-300">
              <div className="text-center text-sm text-muted-foreground mb-4">
                {cardType === 'classic' ? t('studySession.rateRecall') : 'How did you do?'}
              </div>
              {renderGradingButtons()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};