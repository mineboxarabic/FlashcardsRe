import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Users, Bot, BarChart, PenTool, Camera, Zap } from "lucide-react";
import { DeveloperCredit } from "@/components/developer-credit";
import { Link } from "react-router-dom";
import { useSession } from "@/components/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation, Trans } from "react-i18next";

const Index = () => {
  const { session, isLoading } = useSession();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const features = [
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: t("landingPage.features.adaptiveLearning.title"),
      description: t("landingPage.features.adaptiveLearning.description"),
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: t("landingPage.features.memoryHeatmap.title"),
      description: t("landingPage.features.memoryHeatmap.description"),
    },
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: t("landingPage.features.aiGenerator.title"),
      description: t("landingPage.features.aiGenerator.description"),
    },
    {
      icon: <PenTool className="h-8 w-8 text-primary" />,
      title: t("landingPage.features.richInputs.title"),
      description: t("landingPage.features.richInputs.description"),
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t("landingPage.features.collaboration.title"),
      description: t("landingPage.features.collaboration.description"),
    },
    {
      icon: <Camera className="h-8 w-8 text-primary" />,
      title: t("landingPage.features.smartRecall.title"),
      description: t("landingPage.features.smartRecall.description"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{t('appName')}</h1>
        <nav className="space-x-4 flex items-center">
          {isLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : session ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" className="hover:scale-[1.02] transition-transform duration-200">{t('header.dashboard')}</Button>
              </Link>
              <Button onClick={handleLogout} className="hover:scale-[1.02] transition-transform duration-200">{t('landingPage.logout')}</Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="hover:scale-[1.02] transition-transform duration-200">{t('landingPage.login')}</Button>
              </Link>
              <Link to="/login">
                <Button className="hover:scale-[1.02] transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">{t('landingPage.getStarted')}</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center py-20 sm:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
              <Trans i18nKey="landingPage.heroTitle">
                Master Anything with <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Intelligent Flashcards</span>.
              </Trans>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground">
              {t('landingPage.heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link to={session ? "/dashboard" : "/login"}>
                <Button size="lg" className="hover:scale-110 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl">
                  <Zap className="h-5 w-5 mr-2" />
                  {t('landingPage.startLearning')}
                </Button>
              </Link>
              {session && (
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="hover:scale-110 transition-all duration-300">
                    {t('landingPage.createFirstCard')}
                  </Button>
                </Link>
              )}
            </div>
            {!session && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t('landingPage.noCreditCard')}
              </p>
            )}
          </div>
        </section>

        {/* Quick Start Section for Logged In Users */}
        {session && (
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h3 className="text-2xl font-bold mb-4">{t('landingPage.loggedInPromptTitle')}</h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('landingPage.loggedInPromptSubtitle')}
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                    <Zap className="h-5 w-5 mr-2" />
                    {t('landingPage.quickCreateCard')}
                  </Button>
                </Link>
                <Link to="/study">
                  <Button size="lg" variant="outline">
                    {t('landingPage.startStudying')}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-3xl sm:text-4xl font-bold text-foreground">{t('landingPage.featuresTitle')}</h3>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                {t('landingPage.featuresSubtitle')}
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card 
                  key={feature.title} 
                  className="flex flex-col bg-background/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]"
                >
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>{t('landingPage.footer', { year: new Date().getFullYear() })}</p>
          <DeveloperCredit />
        </div>
      </footer>
    </div>
  );
};

export default Index;