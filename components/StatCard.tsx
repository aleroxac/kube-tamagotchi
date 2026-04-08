
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, percentage, color, icon }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-bold text-lg">{value}</span>
      </div>
      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${color}`} 
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatCard;
