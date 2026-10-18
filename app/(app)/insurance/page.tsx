import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderCard } from '@/components/ui/placeholder-card';
import { ShieldCheckIcon } from '@/components/ui/icons';

export default function InsurancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance & Protection"
        description="Manage health, life, vehicle, and home insurance policies, premiums, and renewals."
        badge="Risk Management"
      />

      <PlaceholderCard
        icon={ShieldCheckIcon}
        title="Policy & Premium Management"
        description="Never miss a premium due date or policy renewal. Track your family's coverage and measure insurance burden against your monthly income."
        bullets={[
          'Health, life, and motor insurance tracking',
          'Premium payment frequencies & renewal dates',
          'Insurance burden ratio vs salary',
          'Policy details and coverage documentation',
        ]}
      />
    </div>
  );
}
