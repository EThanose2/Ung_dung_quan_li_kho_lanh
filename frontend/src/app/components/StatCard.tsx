import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}

export function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{label}</p>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-7 h-7 ${color}`} />
        </div>
      </div>
    </div>
  );
}
