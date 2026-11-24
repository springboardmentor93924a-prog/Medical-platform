import EmptyState from '../../components/ui/EmptyState';
import { IconOrders } from '../../components/icons/Icons';

export default function OrdersPage() {
  return (
    <EmptyState
      title="Orders"
      message="The orders module is under development. Build the GET /api/orders endpoint to populate this page."
      icon={<IconOrders size={40} />}
    />
  );
}
