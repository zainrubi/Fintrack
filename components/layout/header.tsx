'use client';

import { usePathname } from 'next/navigation';
import { BellIcon, MenuIcon } from '@/components/ui/icons';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Dashboard', category: 'Overview' },
  '/salary': { title: 'Salary Management', category: 'Income' },
  '/expenses': { title: 'Expense Tracker', category: 'Outflows' },
  '/savings': { title: 'Savings & Reserves', category: 'Security' },
  '/investments': { title: 'Investments', category: 'Wealth' },
  '/insurance': { title: 'Insurance Policies', category: 'Protection' },
  '/loans': { title: 'Loans & Repayments', category: 'Liabilities' },
  '/reports': { title: 'Financial Reports', category: 'Analytics' },
  '/settings': { title: 'Preferences & Settings', category: 'Configuration' },
};

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const current = ROUTE_TITLES[pathname] ?? {
    title: 'Financial Management',
    category: 'Fintrack',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile Toggle & Page Title / Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <MenuIcon size={20} />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              {current.category}
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">/</span>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              {current.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Right: Quick actions, Status indicator & Profile avatar */}
      <div className="flex items-center gap-3">
        {/* Workspace Tag */}
        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Active Period: Oct 2026
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <BellIcon size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" />
        </button>

        {/* User Avatar Placeholder */}
        <div className="flex items-center pl-2 border-l border-slate-200">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-2xs cursor-pointer ring-2 ring-slate-100 hover:ring-emerald-600/40 transition-all"
            title="User Profile"
          >
            ZR
          </div>
        </div>
      </div>
    </header>
  );
}
