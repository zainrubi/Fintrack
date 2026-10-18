import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderCard } from '@/components/ui/placeholder-card';
import { PiggyBankIcon } from '@/components/ui/icons';

export default function SavingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings & Reserves"
        description="Build financial resilience by tracking emergency cash reserves and specific savings goals."
        badge="Safety Cushion"
      />

      <PlaceholderCard
        icon={PiggyBankIcon}
        title="Cash Reserves & Goal Allocations"
        description="Monitor your emergency fund progress (3-6 months of living expenses) alongside dedicated funds for down payments, education, travel, and major milestones."
        bullets={[
          'Emergency fund target tracking (months of expenses)',
          'Dedicated savings goal allocations',
          'Savings rate percentage benchmarking',
          'Liquid reserve balance calculations',
        ]}
      />
    </div>
  );
}
