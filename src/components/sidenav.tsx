'use client';

import Link from 'next/link';
import NavLinks from '@/components/ui/nav-links';
import TophatLogo from './ui/tophat-logo';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signOut } from "@/lib/firebase/auth";

export default function SideNav() {
  const { user } = useAuth();

  const handleSignOut = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    signOut();
  };

  const handleSignIn = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    signInWithGoogle();
  };

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex h-48 items-end justify-start rounded-md bg-blue-600 p-4"
        href="/"
      >
        <div className="w-32 text-white md:w-40">
          <TophatLogo />
        </div>
      </Link>
      <div className="flex grow flex-col justify-between space-y-2">
        <NavLinks />
        <div className="hidden md:block h-auto w-full grow rounded-md bg-gray-50"></div>
        <div>
          {user ? (
            <a
              href="#"
              onClick={handleSignOut}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:justify-start md:p-2 md:px-3"
            >
              Sign Out
            </a>
          ) : (
            <a
              href="#"
              onClick={handleSignIn}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:justify-start md:p-2 md:px-3"
            >
              <img src="/profile.svg" alt="A placeholder user image" className="w-6 h-6" />
              Sign In with Google
            </a>
          )}
        </div>
      </div>
    </div>
  );
}