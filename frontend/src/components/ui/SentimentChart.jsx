import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-4 py-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2 font-medium">Minute {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300 capitalize">{p.name}:</span>
          <span className="font-semibold text-white">{(p.value * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function SentimentChart({ data = [], moodShifts = [] }) {
  if (!data.length) return (
    <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
      No sentiment data available
    </div>
  )

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="sentPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="sentNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="sentNeutral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1c2947" />

          <XAxis
            dataKey="minute"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(v) => `${v}m`}
            axisLine={{ stroke: '#1c2947' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            tick={{ fontSize: 11, fill: '#64748b' }}
            domain={[0, 1]}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '8px' }}
          />

          {/* Mood shift markers */}
          {moodShifts.map((shift, i) => (
            <ReferenceLine
              key={i}
              x={shift.minute}
              stroke="#f59e0b"
              strokeDasharray="4 3"
              label={{ value: '⚡', position: 'top', fontSize: 12 }}
            />
          ))}

          <Area
            type="monotone"
            dataKey="positive"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#sentPositive)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="negative"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#sentNegative)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="neutral"
            stroke="#00d4ff"
            strokeWidth={1.5}
            fill="url(#sentNeutral)"
            dot={false}
            strokeDasharray="4 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
