"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface VolumePoint { label: string; count: number }

export function RequestVolumeChart({ data }: { data: VolumePoint[] }) {
  return <div className="h-[300px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 16, left: -18, bottom: 4 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12 }} />
        <Line type="monotone" dataKey="count" name="Requests" stroke="#0f2c52" strokeWidth={3} dot={{ r: 3, fill: "#0f2c52" }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
