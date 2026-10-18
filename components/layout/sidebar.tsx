'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3Icon,
  CreditCardIcon,
  FintrackLogo,
  LayoutDashboardIcon,
  PiggyBankIcon,
  ReceiptIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  WalletIcon,
  XIcon,
} from '@/components/ui/icons';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

export const MAIN_NAV_ITEMS: readonly NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Salary', href: '/salary', icon: WalletIcon },
  { name: 'Expenses', href: '/expenses', icon: ReceiptIcon },
  { name: 'Savings', href: '/savings', icon: PiggyBankIcon },
  { name: 'Investments', href: '/investments', icon: TrendingUpIcon },
  { name: 'Insurance', href: '/insurance', icon: ShieldCheckIcon },
  { name: 'Loans', href: '/loans', icon: CreditCardIcon },
] as const;

export const SECONDARY_NAV_ITEMS: readonly NavItem[] = [
  { name: 'Reports', href: '/reports', icon: BarChart3Icon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
] as const;

interface SidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ onCloseMobile, isMobile = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg py-1 px-1"
        >
          <FintrackLogo size={32} />
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight text-lg leading-tight">
              Fintrack
            </span>
            <span className="text-[11px] font-medium text-emerald-700 tracking-wide uppercase">
              Salary &amp; Wealth
            </span>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <XIcon size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Financial Management
          </div>
          <nav className="space-y-1" aria-label="Main Navigation">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600`}
                >
                  <Icon
                    size={19}
                    className={`transition-colors shrink-0 ${
                      isActive
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Analysis &amp; Config
          </div>
          <nav className="space-y-1" aria-label="Secondary Navigation">
            {SECONDARY_NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600`}
                >
                  <Icon
                    size={19}
                    className={`transition-colors shrink-0 ${
                      isActive
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile Teaser */}
      <div className="border-t border-slate-100 p-3.5">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 border border-slate-200/80">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            SP
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-800 truncate">
              Salaried Pro
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              PKR · Personal Plan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
