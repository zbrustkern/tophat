// import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import styles from '@/app/ui/home.module.css';
import Image from 'next/image';
import TophatLogo from '@/components/ui/tophat-logo';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 h-52 justify-start">
          <TophatLogo />
      </div>
      <div>
        
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          <p className={`text-xl text-gray-800 md:text-3xl md:leading-normal`}>
            <strong>Welcome to Tophat Financial,</strong> a financial planning and literacy app. Brought to you by notZeke.
          </p>
          <Link
            href="/dashboard"
            className="flex items-center gap-5 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
          >
            <span>Get Started</span> 
            {/* <ArrowRightIcon className="w-5 md:w-6" /> */}
          </Link>
        </div>
        <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
          {/* <Image
            src="/hero-desktop.png"
            width={500}
            height={500}
            className="hidden md:block"
            alt="Screenshots of tophat financial showing desktop version"
          />
          <Image
          src='/hero-desktop.png'
          width={560}
          height={620}
          className="block md:hidden"
          alt="Screenshot of tophat financial showing mobile versions"
          /> */}
        </div>
      </div>
    </main>
  );
}
