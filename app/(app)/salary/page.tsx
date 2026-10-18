import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderCard } from '@/components/ui/placeholder-card';
import { WalletIcon } from '@/components/ui/icons';

export default function SalaryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary & Income"
        description="Record, manage, and track your primary monthly salary, bonuses, increments, and income history."
        badge="Income Stream"
      />

      <PlaceholderCard
        icon={WalletIcon}
        title="Salary Records & History"
        description="Maintain a complete audit trail of your monthly salary payments over time. Track changes in compensation, employer sources, bonuses, and tax deductions."
        bullets={[
          'Multiple salary records across pay periods',
          'Primary, bonus, freelance, and allowance streams',
          'Historical compensation comparison',
          'Currency configuration & net pay tracking',
        ]}
      />
    </div>
  );
}
