"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const colors = { Pending: "#64748b", "In Progress": "#f59e0b", Resolved: "#16a34a" };
interface StatusDatum { name: keyof typeof colors; value: number }

export function StatusChart({ data }: { data: StatusDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2"><CardTitle className="text-base">Status distribution</CardTitle><p className="text-xs text-slate-500">{total} total service requests</p></CardHeader>
      <CardContent className="flex flex-col items-center justify-center px-2 pb-4 sm:px-4">
        {total ? <>
          <div className="relative h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={3} stroke="white" strokeWidth={3}>
                  {data.map((item) => <Cell key={item.name} fill={colors[item.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold text-slate-900">{total}</span><span className="text-[10px] uppercase tracking-wide text-slate-500">Requests</span></div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {data.map((item) => <div className="flex items-center gap-1.5 text-xs text-slate-600" key={item.name}><span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: colors[item.name] }} />{item.name}<span className="font-semibold text-slate-900">{item.value}</span></div>)}
          </div>
        </> : <div className="grid h-[300px] w-full place-items-center text-sm text-slate-500">No request data yet</div>}
      </CardContent>
    </Card>
  );
}
