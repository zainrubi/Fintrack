import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderCard } from '@/components/ui/placeholder-card';
import { CreditCardIcon } from '@/components/ui/icons';

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans & Debt Obligations"
        description="Monitor outstanding balances, monthly installments (EMIs), interest rates, and loan payoff progress."
        badge="Liabilities"
      />

      <PlaceholderCard
        icon={CreditCardIcon}
        title="Liabilities & Repayment Schedules"
        description="Maintain visibility over all bank financing, car loans, home mortgages, and personal loans. Keep your Debt-to-Income (DTI) ratio within a healthy threshold."
        bullets={[
          'Principal, outstanding balance, and interest rate',
          'Monthly EMI installment tracking',
          'Debt-to-Income (DTI) ratio calculations',
          'Payoff timelines and repayment records',
        ]}
      />
    </div>
  );
}
