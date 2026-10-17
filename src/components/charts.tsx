"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = { fontSize: 11, fill: "#94a3b8" };

function TooltipCard({
  active,
  payload,
  label,
  suffix = "%",
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 shadow-card">
      <p className="text-[11px] font-bold text-ink-400">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-display text-sm font-extrabold text-ink-900">
          {p.name ? `${p.name}: ` : ""}
          {p.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}

export function TrendArea({
  data,
  height = 220,
  color = "#4f46e5",
}: {
  data: { label: string; value: number; title?: string }[];
  height?: number;
  color?: string;
}) {
  const compact = data.map((d) => ({
    label: d.label.slice(5),
    value: d.value,
    title: d.title ?? "",
  }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={compact} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<TooltipCard />} cursor={{ stroke: "#c7d2fe", strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="value"
            name="Score"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#trendGrad)"
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubjectBars({
  data,
  height = 240,
}: {
  data: { subject: string; avg: number }[];
  height?: number;
}) {
  const compact = data.map((d) => ({
    subject: d.subject.length > 8 ? d.subject.slice(0, 7) + "…" : d.subject,
    avg: Math.round(d.avg),
  }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={compact} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <XAxis dataKey="subject" tick={axis} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={axis} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<TooltipCard />} cursor={{ fill: "rgba(99,102,241,.06)" }} />
          <Bar dataKey="avg" name="Average" radius={[8, 8, 4, 4]} maxBarSize={44}>
            {compact.map((_, i) => (
              <Cell key={i} fill={["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#7c3aed", "#8b5cf6"][i % 6]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ClassBars({
  data,
  height = 240,
}: {
  data: { name: string; avg: number }[];
  height?: number;
}) {
  const compact = data.map((d) => ({ name: d.name.replace("Class ", "C"), avg: Math.round(d.avg) }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={compact} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={axis} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<TooltipCard />} cursor={{ fill: "rgba(99,102,241,.06)" }} />
          <Bar dataKey="avg" name="Class average" radius={[8, 8, 4, 4]} maxBarSize={48} fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttendanceDonut({ pct }: { pct: number }) {
  const present = Math.round(pct);
  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: 100 - present },
  ];
  return (
    <div className="relative h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill="#4f46e5" />
            <Cell fill="#e2e8f0" />
          </Pie>
          <Tooltip content={<TooltipCard suffix="%" />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold text-ink-900">
          {Math.round(pct)}%
        </span>
        <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
          attendance
        </span>
      </div>
    </div>
  );
}
