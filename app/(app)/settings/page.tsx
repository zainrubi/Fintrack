import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderCard } from '@/components/ui/placeholder-card';
import { SettingsIcon } from '@/components/ui/icons';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Preferences"
        description="Configure default currency, targets, category customization, and account preferences."
        badge="Configuration"
      />

      <PlaceholderCard
        icon={SettingsIcon}
        title="Application Configuration"
        description="Set your default operating currency (PKR, USD, etc.), customize standard expense categories, and establish your monthly income and savings targets."
        bullets={[
          'Default currency and number localization',
          'Custom expense & savings category manager',
          'Monthly income and emergency fund targets',
          'Data export & backup options',
        ]}
      />
    </div>
  );
}
