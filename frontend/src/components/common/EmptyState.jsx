import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There are currently no items in this section. Get started by adding your first record.',
  actionLabel,
  onAction,
  action,
  className = '',
}) => {
  const finalActionLabel = action?.label || actionLabel;
  const finalOnAction = action?.onClick || onAction;

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {finalActionLabel && finalOnAction && (
        <Button onClick={finalOnAction} variant="primary">
          {finalActionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
