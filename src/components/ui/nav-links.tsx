'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { name: 'Income Planner', href: '/dashboard', icon: '$' },
  {
    name: 'Savings Planner',
    href: '/dashboard/',
    icon: '$',
  }
];

export default function NavLinks() {
  const pathname = usePathname();
 
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-start gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:p-2 md:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            <span className="flex items-center justify-center w-6 h-6">{LinkIcon}</span>
            <span>{link.name}</span>
          </Link>
        );
      })}
    </>
  );
}