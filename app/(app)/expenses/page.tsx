import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderCard } from '@/components/ui/placeholder-card';
import { ReceiptIcon } from '@/components/ui/icons';

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Tracker"
        description="Categorize and monitor your fixed obligations and discretionary variable spending."
        badge="Outflows"
      />

      <PlaceholderCard
        icon={ReceiptIcon}
        title="Fixed vs Variable Expense Management"
        description="Keep expenses disciplined by cleanly distinguishing non-negotiable fixed living costs (housing, utilities, education) from day-to-day variable spending."
        bullets={[
          'Predefined and custom expense categories',
          'Fixed vs variable classification',
          'Recurring expense scheduling',
          'Expense ratio calculations vs monthly salary',
        ]}
      />
    </div>
  );
}
