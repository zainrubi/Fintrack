import type { ReactNode } from 'react';

interface PlaceholderCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  bullets?: string[];
  actionLabel?: string;
}

export function PlaceholderCard({
  icon: Icon,
  title,
  description,
  bullets,
}: PlaceholderCardProps): ReactNode {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <Icon size={24} />
        </div>

        <div className="space-y-3 flex-1 min-w-0">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-2xl">
              {description}
            </p>
          </div>

          {bullets && bullets.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Upcoming Scope
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                {bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Module Foundation Ready
            </span>
            <span className="text-xs text-slate-400">
              Step-by-step implementation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
