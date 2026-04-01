'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { PIPELINE_STAGES } from '@/lib/constants';
import type { LeadsByStage, LeadsBySource } from '@/lib/queries/analytics';

interface StageChartProps {
  data: LeadsByStage[];
}

export function StageChart({ data }: StageChartProps) {
  const chartData = PIPELINE_STAGES.map((stage) => ({
    name: stage.label,
    count: data.find((d) => d.status === stage.value)?.count ?? 0,
    fill: stage.color,
  }));

  if (chartData.every((d) => d.count === 0)) {
    return (
      <div className="border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        No lead data yet
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Leads by Stage</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              border: '1px solid #e5e7eb',
              borderRadius: 0,
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface SourceChartProps {
  data: LeadsBySource[];
}

const SOURCE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#8b5cf6', '#ec4899', '#64748b',
];

export function SourceChart({ data }: SourceChartProps) {
  if (data.length === 0) {
    return (
      <div className="border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        No source data yet
      </div>
    );
  }

  return (
    <div className="border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Leads by Source</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="source"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, value }) => `${name} (${value})`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              border: '1px solid #e5e7eb',
              borderRadius: 0,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
