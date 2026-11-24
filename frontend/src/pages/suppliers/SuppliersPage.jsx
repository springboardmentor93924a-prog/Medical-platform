import EmptyState from '../../components/ui/EmptyState';
import { IconSuppliers } from '../../components/icons/Icons';

export default function SuppliersPage() {
  return (
    <EmptyState
      title="Suppliers"
      message="The suppliers module is under development. Build the GET /api/suppliers endpoint to populate this page."
      icon={<IconSuppliers size={40} />}
    />
  );
}
