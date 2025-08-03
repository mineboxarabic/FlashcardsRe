import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, BookOpen, Brain, TrendingUp, Play, Target, Clock, Star, Zap, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickCreateCardDialog } from "@/components/QuickCreateCardDialog";
import { CreateDeckDialog } from "@/components/CreateDeckDialog";
import { useTranslation } from "react-i18next";
import { DialogTrigger } from "@/components/ui/dialog";

const Dashboard = () => {
  const { session } = useSession();
  const { t } = useTranslation();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isDeckCreateOpen, setIsDeckCreateOpen] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      if (!session?.user) return null;
      
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select(`
          id,
          difficulty,
          review_count,
          correct_count,
          last_reviewed,
          created_at,
          interval,
          ease_factor,
          next_review_date,
          deck:decks(title)
        `)
        .eq('user_id', session.user.id);

      if (cardsError) throw cardsError;

      const { data: decks, error: decksError } = await supabase
        .from('decks')
        .select('id')
        .eq('user_id', session.user.id);

      if (decksError) throw decksError;

      const now = new Date();
      const totalCards = cards?.length || 0;
      const studiedCards = cards?.filter(c => c.review_count > 0).length || 0;
      const totalReviews = cards?.reduce((sum, card) => sum + card.review_count, 0) || 0;
      const correctReviews = cards?.reduce((sum, card) => sum + card.correct_count, 0) || 0;
      const accuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;
      
      // Cards due for review (including overdue)
      const dueCards = cards?.filter(card => 
        !card.next_review_date || new Date(card.next_review_date) <= now
      ).length || 0;

      // Overdue cards (more than 1 day past due date)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const overdueCards = cards?.filter(card => 
        card.next_review_date && new Date(card.next_review_date) < oneDayAgo
      ).length || 0;

      // New cards (never reviewed)
      const newCards = cards?.filter(card => card.review_count === 0).length || 0;

      // Learning cards (reviewed but interval < 21 days)
      const learningCards = cards?.filter(card => 
        card.review_count > 0 && card.interval < 21
      ).length || 0;

      // Mature cards (interval >= 21 days)
      const matureCards = cards?.filter(card => card.interval >= 21).length || 0;

      // Calculate study streak (days with reviews)
      const reviewDates = cards?.map(c => c.last_reviewed).filter(Boolean) || [];
      const uniqueDates = [...new Set(reviewDates.map(date => new Date(date).toDateString()))];
      const studyStreak = uniqueDates.length;

      return {
        totalCards,
        totalDecks: decks?.length || 0,
        studiedCards,
        studyStreak,
        accuracy,
        dueCards,
        overdueCards,
        newCards,
        learningCards,
        matureCards,
        recentCards: cards?.slice(0, 5) || [],
      };
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const quickStats = [
    { 
      title: t("dashboard.totalCards"), 
      value: stats?.totalCards || 0, 
      icon: <BookOpen className="h-5 w-5" />, 
      color: "text-blue-600",
      change: t("dashboard.newCardsCount", { count: stats?.newCards || 0 })
    },
    { 
      title: t("dashboard.dueForReview"), 
      value: stats?.dueCards || 0, 
      icon: <Clock className="h-5 w-5" />, 
      color: stats?.overdueCards && stats.overdueCards > 0 ? "text-red-600" : "text-orange-600",
      change: stats?.overdueCards ? t("dashboard.overdueCount", { count: stats.overdueCards }) : t("dashboard.readyToStudy")
    },
    { 
      title: t("dashboard.studyAccuracy"), 
      value: `${stats?.accuracy || 0}%`, 
      icon: <Target className="h-5 w-5" />, 
      color: "text-purple-600",
      change: t("dashboard.overallPerformance")
    },
    { 
      title: t("dashboard.matureCards"), 
      value: stats?.matureCards || 0, 
      icon: <TrendingUp className="h-5 w-5" />, 
      color: "text-green-600",
      change: t("dashboard.learningCount", { count: stats?.learningCards || 0 })
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t('dashboard.welcome')}
        </h2>
        <p className="text-muted-foreground mt-2">
          {t('dashboard.description')}
        </p>
      </div>

      {/* Priority Alert for Due/Overdue Cards */}
      {stats && stats.dueCards > 0 && (
        <Card className="border-2 border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              {stats.overdueCards > 0 ? t("dashboard.cardsOverdue") : t("dashboard.cardsReadyForReview")}
            </CardTitle>
            <CardDescription className="text-base">
              {stats.overdueCards > 0 
                ? t("dashboard.overdueDescription", { 
                    overdue: stats.overdueCards, 
                    ready: stats.dueCards - stats.overdueCards 
                  })
                : t("dashboard.readyDescription", { count: stats.dueCards })
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/study">
              <Button 
                size="lg" 
                className="hover:scale-[1.02] transition-transform duration-200 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                {t("dashboard.startStudyingNow")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-6 w-6 text-primary" />
            {t('dashboard.quickCreateTitle')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('dashboard.quickCreateDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <QuickCreateCardDialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="hover:scale-[1.02] transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                {t('dashboard.createCardNow')}
              </Button>
            </DialogTrigger>
          </QuickCreateCardDialog>
          
          <CreateDeckDialog open={isDeckCreateOpen} onOpenChange={setIsDeckCreateOpen}>
            <DialogTrigger asChild>
              <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Plus className="h-4 w-4 me-2" />
                {t('dashboard.createDeck')}
              </Button>
            </DialogTrigger>
          </CreateDeckDialog>

          <Link to="/cards">
            <Button variant="outline" className="hover:scale-[1.02] transition-transform duration-200">
              <Plus className="h-4 w-4 me-2" />
              {t('dashboard.advancedCreator')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card 
            key={stat.title}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && stats.totalCards > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('dashboard.studyProgress')}
              </CardTitle>
              <CardDescription>{t('dashboard.studyProgressDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('dashboard.cardsStudied')}</span>
                  <span>{stats.studiedCards} / {stats.totalCards}</span>
                </div>
                <Progress 
                  value={(stats.studiedCards / stats.totalCards) * 100} 
                  className="h-2"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.matureCards}</div>
                  <div className="text-sm text-muted-foreground">{t('dashboard.mature')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.learningCards}</div>
                  <div className="text-sm text-muted-foreground">{t('dashboard.learning')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.newCards}</div>
                  <div className="text-sm text-muted-foreground">{t('dashboard.new')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {t('dashboard.spacedRepetitionStats')}
              </CardTitle>
              <CardDescription>{t('dashboard.learningAlgorithmPerformance')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.accuracy}%</div>
                  <div className="text-sm text-muted-foreground">{t('dashboard.overallAccuracy')}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-lg font-bold text-red-600">{stats.dueCards}</div>
                    <div className="text-muted-foreground">{t('dashboard.dueToday')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{stats.studyStreak}</div>
                    <div className="text-muted-foreground">{t('dashboard.studyDays')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;