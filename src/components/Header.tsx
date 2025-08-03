import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { UserNav } from "./UserNav";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Menu, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { QuickCreateCardDialog } from "./QuickCreateCardDialog";
import { DialogTrigger } from "./ui/dialog";

export const Header = () => {
  const { t, i18n } = useTranslation();
  const sheetSide = i18n.dir() === 'rtl' ? 'right' : 'left';
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const navLinks = [
    { to: "/dashboard", label: t('header.dashboard') },
    { to: "/study", label: t('header.study') },
    { to: "/decks", label: t('header.myDecks') },
    { to: "/cards", label: t('header.myCards') },
    { to: "/how-it-works", label: t('header.howItWorks') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="me-4 hidden md:flex">
          <Link to="/" className="me-6 flex items-center space-x-2 hover:scale-[1.02] transition-transform duration-200">
            <img src="/logo.svg" alt="NeuroCards Logo" className="h-8 w-8" />
            <span className="hidden font-bold sm:inline-block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('appName')}
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "transition-colors duration-200 hover:text-foreground/80 relative",
                    isActive 
                      ? "text-foreground after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-primary" 
                      : "text-foreground/60"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:scale-[1.02] transition-transform duration-200">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={sheetSide} className="ps-0">
              <Link to="/" className="flex items-center space-x-2 hover:scale-[1.02] transition-transform duration-200">
                <img src="/logo.svg" alt="NeuroCards Logo" className="h-6 w-6" />
                <span className="font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {t('appName')}
                </span>
              </Link>
              <div className="my-4 h-[calc(100vh-8rem)] pb-10 pe-6">
                <div className="flex flex-col space-y-3">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        cn(
                          "transition-colors duration-200 hover:text-foreground/80",
                          isActive ? "text-foreground font-medium" : "text-foreground/60"
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Quick Create Button in Header */}
          <div className="hidden sm:block">
            <QuickCreateCardDialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  {t('header.addCard')}
                </Button>
              </DialogTrigger>
            </QuickCreateCardDialog>
          </div>
          <LanguageSwitcher />
          <UserNav />
        </div>
      </div>
    </header>
  );
};