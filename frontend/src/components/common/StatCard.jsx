import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  onClick,
}) => {
  const getColorStyles = () => {
    switch (color) {
      case 'emerald':
      case 'green':
        return {
          bg: 'bg-emerald-500/10 text-emerald-600',
          border: 'hover:border-emerald-200',
          badge: 'bg-emerald-50 text-emerald-700',
        };
      case 'rose':
      case 'red':
        return {
          bg: 'bg-rose-500/10 text-rose-600',
          border: 'hover:border-rose-200',
          badge: 'bg-rose-50 text-rose-700',
        };
      case 'amber':
      case 'orange':
        return {
          bg: 'bg-amber-500/10 text-amber-600',
          border: 'hover:border-amber-200',
          badge: 'bg-amber-50 text-amber-700',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/10 text-purple-600',
          border: 'hover:border-purple-200',
          badge: 'bg-purple-50 text-purple-700',
        };
      case 'teal':
        return {
          bg: 'bg-teal-500/10 text-teal-600',
          border: 'hover:border-teal-200',
          badge: 'bg-teal-50 text-teal-700',
        };
      case 'blue':
      default:
        return {
          bg: 'bg-sky-500/10 text-sky-600',
          border: 'hover:border-sky-200',
          badge: 'bg-sky-50 text-sky-700',
        };
    }
  };

  const styles = getColorStyles();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all ${
        styles.border
      } ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${styles.bg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {subtitle && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <span>{subtitle}</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
