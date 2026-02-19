import { BarChart3, Upload, Settings, TrendingUp } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-16 bg-navy-deep border-r border-navy-medium flex flex-col items-center py-6 gap-6 shrink-0">
      {/* Logo mark */}
      <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mb-4">
        <span className="font-serif text-gold font-bold text-sm">RL</span>
      </div>

      <NavIcon icon={<BarChart3 size={20} />} label="Analysis" active />
      <NavIcon icon={<Upload size={20} />} label="Upload" />
      <NavIcon icon={<TrendingUp size={20} />} label="Trends" />

      <div className="mt-auto">
        <NavIcon icon={<Settings size={20} />} label="Settings" />
      </div>
    </aside>
  );
}

function NavIcon({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      title={label}
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all
        ${active
          ? 'bg-gold/15 text-gold border border-gold/20'
          : 'text-gray-muted hover:text-cream hover:bg-navy-light border border-transparent'
        }`}
    >
      {icon}
    </button>
  );
}
