import React from 'react';
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

import { LogOut, User } from 'lucide-react';
import { AuthModal } from './AuthModal';

export default function SignInButton({ variant = 'navbar', onAvatarClick }: { 
  variant?: 'navbar' | 'hero' | 'compact';
  onAvatarClick?: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authTab, setAuthTab] = React.useState<'signin' | 'signup'>('signin');

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Sign In Failed",
        description: error?.message || "Could not complete Google Sign-In. Please check your browser popup settings.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been signed out safely.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (user) {
    if (variant === 'compact') {
      return (
        <button
          onClick={onAvatarClick}
          className="h-8 w-8 rounded-full bg-deco-gold/20 border border-deco-gold/50 flex items-center justify-center text-deco-gold font-display font-semibold text-xs shrink-0 hover:scale-105 transition-transform"
          title={user.email || 'User Account'}
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="h-full w-full rounded-full object-cover" />
          ) : (
            user.email ? user.email[0].toUpperCase() : 'U'
          )}
        </button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-full bg-deco-gold/20 border border-deco-gold/40 flex items-center justify-center text-deco-gold font-display font-semibold text-xs shrink-0">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="h-full w-full rounded-full object-cover" />
            ) : (
              user.email ? user.email[0].toUpperCase() : 'U'
            )}
          </div>
          <span className="text-xs text-white/80 font-medium truncate max-w-[110px] sm:max-w-[130px]" title={user.email || ''}>
            {user.email}
          </span>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="h-8 text-xs border-deco-gold/30 text-deco-gold hover:bg-deco-gold/10 hover:text-white font-display uppercase tracking-wider font-semibold shrink-0"
        >
          <LogOut className="h-3.5 w-3.5 mr-1 text-rose-400" /> Sign Out
        </Button>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <Button 
          onClick={() => { setAuthTab('signin'); setIsAuthModalOpen(true); }}
          size="lg"
          className="bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest font-semibold px-8 py-6 text-sm shadow-lg shadow-deco-gold/20"
        >
          Sign In / Create Account
        </Button>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultTab={authTab} />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => { setAuthTab('signin'); setIsAuthModalOpen(true); }}
          className="px-3 py-1.5 rounded-sm border border-deco-gold/40 bg-deco-gold/10 text-deco-gold font-display text-xs tracking-wider uppercase font-semibold hover:bg-deco-gold/20 transition-colors"
        >
          Sign In
        </button>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultTab={authTab} />
      </>
    );
  }

  return (
    <>
      <Button 
        variant="outline"
        onClick={() => { setAuthTab('signin'); setIsAuthModalOpen(true); }}
        className="h-9 w-full justify-center border-deco-gold/40 text-deco-gold hover:bg-deco-gold/10 font-display text-xs tracking-wider uppercase"
      >
        Sign In / Sign Up
      </Button>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultTab={authTab} />
    </>
  );
}