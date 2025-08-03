import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full animate-ping"></div>
      </div>
      
      <div className="w-full max-w-md p-8 space-y-8 bg-background/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-border/50 animate-in fade-in slide-in-from-bottom duration-700 relative z-10">
        <div className="text-center animate-in fade-in slide-in-from-top duration-700 delay-200">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to NeuroCards
          </h1>
          <p className="text-muted-foreground mt-2 animate-in fade-in slide-in-from-top duration-700 delay-400">
            Sign in or create an account to get started
          </p>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-600">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: {
                  transition: 'all 0.2s ease',
                  transform: 'scale(1)',
                },
                input: {
                  transition: 'all 0.2s ease',
                },
              },
              className: {
                button: 'hover:scale-105 transition-transform duration-200',
                input: 'hover:border-primary/50 transition-colors duration-200',
              }
            }}
            providers={[]}
            theme="dark"
            socialLayout="horizontal"
            localization={{
              variables: {
                sign_up: {
                  additional_data: {
                    first_name: 'First Name',
                    last_name: 'Last Name',
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;