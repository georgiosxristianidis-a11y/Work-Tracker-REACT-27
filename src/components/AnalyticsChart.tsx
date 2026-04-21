import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export default function AnalyticsChart({ chartData, curSym, goal, t }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--t3)', fontWeight: 'bold' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--t3)', fontWeight: 'bold' }} tickFormatter={(val) => `${curSym}${val}`} />
        <Tooltip 
          cursor={{ fill: 'var(--b)' }}
          contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--b)', borderRadius: '1rem', fontSize: '12px', fontWeight: 'bold', color: 'var(--t1)' }}
          itemStyle={{ color: 'var(--a)' }}
          formatter={(value: number) => [`${curSym}${value.toFixed(2)}`, t('Earned')]}
        />
        <ReferenceLine y={goal || 0} stroke="var(--a)" strokeDasharray="3 3" opacity={0.5} />
        <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
          {chartData.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.earnings >= goal ? 'var(--a)' : 'var(--t3)'} opacity={entry.earnings >= goal ? 1 : 0.5} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
