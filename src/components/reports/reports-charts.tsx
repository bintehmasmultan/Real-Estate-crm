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

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-slate-500">
      {label}
    </div>
  );
}

export function ReportsCharts({
  leadsBySource,
  leadStatus,
  salesByStage,
  rentalsByStage,
  agentPerf,
}: {
  leadsBySource: { name: string; value: number }[];
  leadStatus: { name: string; count: number }[];
  salesByStage: { name: string; count: number }[];
  rentalsByStage: { name: string; count: number }[];
  agentPerf: { name: string; deals: number; closed: number; value: number }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {leadsBySource.length === 0 ? (
        <EmptyChart label="No leads by source yet" />
      ) : (
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
      )}
      {leadStatus.length === 0 ? (
        <EmptyChart label="No lead statuses yet" />
      ) : (
        <div className="h-64">
          <p className="mb-2 text-sm font-medium">Leads by status</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {salesByStage.length === 0 ? (
        <EmptyChart label="No sales stages yet" />
      ) : (
        <div className="h-64">
          <p className="mb-2 text-sm font-medium">Sales pipeline</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesByStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {rentalsByStage.length === 0 ? (
        <EmptyChart label="No rental stages yet" />
      ) : (
        <div className="h-64">
          <p className="mb-2 text-sm font-medium">Rentals pipeline</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rentalsByStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {agentPerf.length === 0 ? (
        <EmptyChart label="No agent activity yet" />
      ) : (
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
      )}
    </div>
  );
}
