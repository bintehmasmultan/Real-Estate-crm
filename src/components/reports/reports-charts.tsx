"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#059669", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#14b8a6", "#64748b"];

export function ReportsCharts({
  leadsBySource,
  dealsByStage,
  agentPerf,
}: {
  leadsBySource: { name: string; value: number }[];
  dealsByStage: { name: string; count: number }[];
  agentPerf: { name: string; deals: number; closed: number; value: number }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-64">
        <p className="mb-2 text-sm font-medium">Leads by source</p>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={leadsBySource} dataKey="value" nameKey="name" outerRadius={90} label>
              {leadsBySource.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64">
        <p className="mb-2 text-sm font-medium">Deals by stage</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dealsByStage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 lg:col-span-2">
        <p className="mb-2 text-sm font-medium">Agent performance</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={agentPerf}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="deals" fill="#059669" name="Deals" radius={[6, 6, 0, 0]} />
            <Bar dataKey="closed" fill="#10b981" name="Closed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
