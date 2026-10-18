import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderCard } from '@/components/ui/placeholder-card';
import { LayoutDashboardIcon } from '@/components/ui/icons';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Dashboard"
        description="High-level overview of your monthly salary, expense ratios, savings rate, and financial commitments."
        badge="Active Month"
      />

      <PlaceholderCard
        icon={LayoutDashboardIcon}
        title="Executive Salary & Cash Flow Summary"
        description="The dashboard will aggregate your monthly salary inflow against fixed and variable expenses, savings deposits, investment contributions, insurance premiums, and loan repayments."
        bullets={[
          'Monthly financial snapshot & remaining salary',
          'Savings rate & expense ratio indicators',
          'Fixed vs variable spending distribution',
          'Debt-to-income and insurance burden ratios',
        ]}
      />
    </div>
  );
}
