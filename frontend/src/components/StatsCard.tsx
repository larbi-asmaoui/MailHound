import React from "react";

interface StatsCardProps {
  label: string;
  value: number;
  color: string; // ex: 'text-green-400'
  percent?: number; // optionnel, pour afficher un pourcentage
}

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  color,
  percent,
}) => {
  return (
    <div className="bg-background-card border border-border rounded-xl p-6 flex flex-col items-center">
      <span className="text-gray-400 mb-2">{label}</span>
      <span className={`text-3xl font-bold ${color} mb-2`}>{value}</span>
      {percent !== undefined && (
        <div className="w-12 h-12 mt-2 flex items-center justify-center">
          <span className={`text-xs ${color}`}>{percent}%</span>
        </div>
      )}

      {/* <div className="bg-background-card rounded-xl shadow p-6 text-center border border-border">
            <div className="text-3xl font-bold text-primary mb-2">
              {stats.total}
            </div>
            <div className="text-sm text-gray-400">Total Emails</div>
          </div> */}
    </div>
  );
};

export default StatsCard;
