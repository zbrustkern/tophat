import Link from 'next/link';
import NavLinks from '@/components/ui/nav-links';
import TophatLogo from './ui/tophat-logo';
// import { PowerIcon } from '@heroicons/react/24/outline';

export default function SideNav() {
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
        <form>
          <button className="flex h-[48px] w-full items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:justify-start md:p-2 md:px-3">
            {/* <PowerIcon className="w-6" /> */}
            <div className="block">Sign Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}