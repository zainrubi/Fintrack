import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderCard } from '@/components/ui/placeholder-card';
import { TrendingUpIcon } from '@/components/ui/icons';

export default function InvestmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Investments"
        description="Track long-term wealth creation, mutual funds, real estate, gold, and retirement contributions."
        badge="Wealth Building"
      />

      <PlaceholderCard
        icon={TrendingUpIcon}
        title="Investment Portfolio Tracking"
        description="Keep a clear record of capital deployed into growth and income-generating assets away from your daily operational expenses."
        bullets={[
          'Mutual funds, equities, and bonds logging',
          'Real estate, gold, and provident fund entries',
          'Monthly investment allocation rate',
          'Asset diversification distribution',
        ]}
      />
    </div>
  );
}
