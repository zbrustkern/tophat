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

export default function SignInButton({ variant = 'navbar' }: { variant?: 'navbar' | 'hero' }) {
  const { user } = useAuth();
  const { toast } = useToast();

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
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={user.email || ''}>
          {user.email}
        </span>
        <Button 
          variant="outline"
          onClick={handleSignOut}
          className="h-8 text-xs border-white/20 text-foreground hover:bg-white/10"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <Button 
        onClick={handleSignIn}
        size="lg"
        className="bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest font-semibold px-8 py-6 text-sm shadow-lg shadow-deco-gold/20"
      >
        <GoogleIcon /> Sign in with Google
      </Button>
    );
  }

  return (
    <Button 
      variant="outline"
      onClick={handleSignIn}
      className="h-9 w-full justify-center border-deco-gold/40 text-deco-gold hover:bg-deco-gold/10 font-display text-xs tracking-wider uppercase"
    >
      <GoogleIcon /> Sign in
    </Button>
  );
}