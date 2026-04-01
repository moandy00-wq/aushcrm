interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function KpiCard({ label, value, subtitle }: KpiCardProps) {
  return (
    <div className="border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}
