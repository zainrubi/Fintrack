import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderCard } from '@/components/ui/placeholder-card';
import { BarChart3Icon } from '@/components/ui/icons';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Comprehensive monthly and annual comparisons, cash flow breakdowns, and savings trends."
        badge="Analytics"
      />

      <PlaceholderCard
        icon={BarChart3Icon}
        title="Historical Reporting & Trend Analysis"
        description="Compare how your financial habits change over time. Analyze salary growth, expense creep, savings consistency, and asset accumulation month-over-month and year-over-year."
        bullets={[
          'Monthly and annual cash flow statements',
          'Expense category breakdown & variance analysis',
          'Savings rate progression over time',
          'Exportable summaries for tax and planning',
        ]}
      />
    </div>
  );
}
