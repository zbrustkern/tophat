import React from 'react';
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInButton() {
  const { user } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
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
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user.email}
        </span>
        <Button 
          variant="outline"
          onClick={handleSignOut}
          className="h-8"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="outline"
      onClick={handleSignIn}
      className="h-8"
    >
      Sign in with Google
    </Button>
  );
}