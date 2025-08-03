import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Zap, CheckCircle, TrendingUp, Lightbulb, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const HowItWorksPage = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <HelpCircle className="h-8 w-8 text-primary" />,
      title: t('howItWorksPage.whatIsSR.title'),
      content: t('howItWorksPage.whatIsSR.content'),
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      title: t('howItWorksPage.learningProcess.title'),
      content: t('howItWorksPage.learningProcess.content'),
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: t('howItWorksPage.yourSession.title'),
      content: t('howItWorksPage.yourSession.content'),
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      title: t('howItWorksPage.gettingStarted.title'),
      content: t('howItWorksPage.gettingStarted.content'),
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {t('howItWorksPage.mainTitle')}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {t('howItWorksPage.mainSubtitle')}
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section, index) => (
          <Card key={index} className="animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: `${index * 150}ms` }}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                {section.icon}
              </div>
              <CardTitle className="text-2xl">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-8">
        <h2 className="text-2xl font-bold">{t('howItWorksPage.readyTitle')}</h2>
        <p className="text-muted-foreground mt-2 mb-6">{t('howItWorksPage.readySubtitle')}</p>
        <div className="flex justify-center gap-4">
          <Link to="/study">
            <Button size="lg" className="hover:scale-105 transition-transform duration-200">
              <Zap className="h-5 w-5 mr-2" />
              {t('studyPage.startSession')}
            </Button>
          </Link>
          <Link to="/cards">
            <Button size="lg" variant="outline" className="hover:scale-105 transition-transform duration-200">
              <CheckCircle className="h-5 w-5 mr-2" />
              {t('cardsPage.title')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;