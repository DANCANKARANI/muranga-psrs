"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryDatum { category: string; count: number }

export function CategoryChart({ data }: { data: CategoryDatum[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2"><CardTitle className="text-base">Requests by service</CardTitle><p className="text-xs text-slate-500">Requests within the selected reporting range</p></CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4">
        {data.length ? <div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-20} textAnchor="end" height={48} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12 }} />
            <Bar dataKey="count" name="Requests" fill="#0f2c52" radius={[5, 5, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer></div> : <div className="grid h-[300px] w-full place-items-center text-sm text-slate-500">No request data yet</div>}
      </CardContent>
    </Card>
  );
}
