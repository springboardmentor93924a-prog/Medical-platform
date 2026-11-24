import EmptyState from '../../components/ui/EmptyState';
import { IconReports } from '../../components/icons/Icons';

export default function ReportsPage() {
  return (
    <EmptyState
      title="Reports & Analytics"
      message="The reports module is under development. Build the GET /api/reports endpoint to populate this page with charts and exportable data."
      icon={<IconReports size={40} />}
    />
  );
}
