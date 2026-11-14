import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export const CategoryBreakdownChart = ({ categories = [] }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No category stock distributions available.
      </div>
    );
  }

  const data = {
    labels: categories.map((c) => c.categoryName),
    datasets: [
      {
        label: 'Medicines Count',
        data: categories.map((c) => c.medicineCount),
        backgroundColor: '#0284c7',
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { color: '#f1f5f9' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  );
};

export const InventoryStatusDoughnut = ({ lowStock = 0, outOfStock = 0, expired = 0, healthy = 0 }) => {
  const total = lowStock + outOfStock + expired + healthy;

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No inventory data available to chart.
      </div>
    );
  }

  const data = {
    labels: ['Healthy Stock', 'Low Stock', 'Out of Stock', 'Expired'],
    datasets: [
      {
        data: [healthy, lowStock, outOfStock, expired],
        backgroundColor: ['#10b981', '#f59e0b', '#f43f5e', '#e11d48'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, font: { size: 11 } },
      },
    },
    cutout: '70%',
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};
