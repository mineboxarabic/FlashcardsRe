import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StudyPage from "./pages/Study";
import ProfilePage from "./pages/Profile";
import DeckDetails from "./pages/DeckDetails";
import CardDetails from "./pages/CardDetails";
import { SessionProvider } from "./components/SessionProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import DecksPage from "./pages/Decks";
import CardsPage from "./pages/Cards";
import HowItWorksPage from "./pages/HowItWorks";

const queryClient = new QueryClient();

const App = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir(i18n.language);
  }, [i18n, i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              
              {/* Authenticated Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/study" element={<StudyPage />} />
                <Route path="/decks" element={<DecksPage />} />
                <Route path="/decks/:deckId" element={<DeckDetails />} />
                <Route path="/cards" element={<CardsPage />} />
                <Route path="/cards/:cardId" element={<CardDetails />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;