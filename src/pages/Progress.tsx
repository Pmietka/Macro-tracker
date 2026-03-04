import React, { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Scale, Flame, Target, Lightbulb, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Navbar } from '../components/Layout/Navbar'
import { getDayNutrition, getLast7Days, getLast30Days, formatDate } from '../utils/calculations'
import { DiaryDay } from '../types'

type Period = '7d' | '30d'
type ChartType = 'calories' | 'macros' | 'weight'

// Simple linear regression: returns slope (units per day) and intercept
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length
  if (n < 2) return null
  const sumX  = points.reduce((s, p) => s + p.x, 0)
  const sumY  = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

export const Progress: React.FC = () => {
  const [period, setPeriod] = useState<Period>('7d')
  const [chartType, setChartType] = useState<ChartType>('calories')
  const [insights, setInsights] = useState<string | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  const diary = useStore(s => s.diary)
  const goals = useStore(s => s.goals)
  const weightLog = useStore(s => s.weightLog)
  const profile = useStore(s => s.profile)

  const dates = period === '7d' ? getLast7Days() : getLast30Days()

  const chartData = useMemo(() => {
    return dates.map(date => {
      const day: DiaryDay = diary[date] ?? { date, entries: [], waterIntake: 0, exercises: [] }
      const n = getDayNutrition(day)
      return {
        date: formatDate(date),
        calories: n.calories,
        protein: Math.round(n.protein),
        carbs: Math.round(n.carbs),
        fat: Math.round(n.fat),
        fiber: Math.round(n.fiber),
        burned: n.caloriesBurned,
        net: n.netCalories,
        water: Math.round(day.waterIntake / 1000 * 10) / 10,
      }
    })
  }, [dates, diary])

  const weightData = useMemo(() => {
    return weightLog
      .filter(w => dates.includes(w.date))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(w => ({ date: formatDate(w.date), weight: w.weight, bodyFat: w.bodyFat }))
  }, [weightLog, dates])

  const stats = useMemo(() => {
    const days = chartData.filter(d => d.calories > 0)
    if (days.length === 0) return null
    const avgCal = Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length)
    const avgProtein = Math.round(days.reduce((s, d) => s + d.protein, 0) / days.length)
    const avgCarbs = Math.round(days.reduce((s, d) => s + d.carbs, 0) / days.length)
    const avgFat = Math.round(days.reduce((s, d) => s + d.fat, 0) / days.length)
    const daysLogged = days.length
    return { avgCal, avgProtein, avgCarbs, avgFat, daysLogged }
  }, [chartData])

  const weightStats = useMemo(() => {
    if (weightLog.length < 2) return null
    const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date))
    const first = sorted[0].weight
    const last = sorted[sorted.length - 1].weight
    const change = last - first
    return { first, last, change, trend: change < 0 ? 'down' : 'up' }
  }, [weightLog])

  // Trend prediction using linear regression on all weight entries
  const trendPrediction = useMemo(() => {
    if (weightLog.length < 5) return null
    const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date))
    const origin = new Date(sorted[0].date).getTime()
    const points = sorted.map(w => ({
      x: (new Date(w.date).getTime() - origin) / 86400000,
      y: w.weight,
    }))
    const reg = linearRegression(points)
    if (!reg) return null
    const ratePerWeek = reg.slope * 7
    if (Math.abs(ratePerWeek) < 0.05) return { type: 'maintain' as const, ratePerWeek }
    return { type: ratePerWeek < 0 ? 'losing' as const : 'gaining' as const, ratePerWeek }
  }, [weightLog])

  const getInsights = async () => {
    setInsightsLoading(true)
    setInsights(null)
    try {
      const last30 = getLast30Days()
      const summaries = last30.map(date => {
        const day: DiaryDay = diary[date] ?? { date, entries: [], waterIntake: 0, exercises: [] }
        const n = getDayNutrition(day)
        return `${date}: ${Math.round(n.calories)}kcal, P:${Math.round(n.protein)}g, C:${Math.round(n.carbs)}g, F:${Math.round(n.fat)}g`
      }).filter(s => !s.includes(': 0kcal')).join('\n')

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Analyze my last 30 days of nutrition data and give me 3-5 specific, actionable insights about patterns, consistency, and areas to improve. Be concise.\n\nData:\n${summaries}\n\nGoals: ${goals.calories}kcal, P:${goals.protein}g, C:${goals.carbs}g, F:${goals.fat}g`,
          }],
          context: { goals, todayEntries: [] },
        }),
      })
      const data = await res.json()
      setInsights(data.text || 'No insights available.')
    } catch {
      setInsights('Failed to load insights. Try again.')
    } finally {
      setInsightsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar title="Progress" />

      <div className="page-container space-y-4">

        {/* Period selector */}
        <div className="flex gap-2">
          {(['7d', '30d'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${
                period === p ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {p === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>

        {/* Chart type selector */}
        <div className="flex gap-2">
          {(['calories', 'macros', 'weight'] as ChartType[]).map(ct => (
            <button
              key={ct}
              onClick={() => setChartType(ct)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                chartType === ct
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {ct}
            </button>
          ))}
        </div>

        {/* Stats summary cards */}
        {stats && chartType !== 'weight' && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Avg. Calories"
              value={`${stats.avgCal}`}
              goal={`${goals.calories}`}
              color="text-primary-500"
              icon={<Flame className="w-4 h-4" />}
            />
            <StatCard
              label="Days Logged"
              value={`${stats.daysLogged}`}
              goal={period === '7d' ? '7' : '30'}
              color="text-blue-500"
              icon={<Target className="w-4 h-4" />}
            />
          </div>
        )}

        {/* Main chart */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {chartType === 'calories' ? 'Calorie Intake' : chartType === 'macros' ? 'Macronutrients' : 'Weight'}
          </h3>

          {chartType === 'calories' && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: number) => [`${val} kcal`, '']}
                />
                <Bar dataKey="calories" fill="#22c55e" radius={[4, 4, 0, 0]} name="Eaten" />
                <Bar dataKey="burned" fill="#f97316" radius={[4, 4, 0, 0]} name="Burned" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartType === 'macros' && (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="protein" stackId="1" stroke="#3b82f6" fill="#3b82f620" name="Protein (g)" />
                <Area type="monotone" dataKey="carbs" stackId="2" stroke="#f59e0b" fill="#f59e0b20" name="Carbs (g)" />
                <Area type="monotone" dataKey="fat" stackId="3" stroke="#ef4444" fill="#ef444420" name="Fat (g)" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartType === 'weight' && (
            <div>
              {weightData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Scale className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No weight entries for this period</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weightData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e' }} name={`Weight (${profile.weightUnit})`} />
                    {weightData.some(w => w.bodyFat) && (
                      <Line type="monotone" dataKey="bodyFat" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Body Fat %" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>

        {/* Net calories trend */}
        {chartType === 'calories' && (
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Net Calories Trend</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} formatter={(val: number) => [`${val} kcal`, 'Net']} />
                <Line type="monotone" dataKey="net" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Net Calories" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Water intake chart */}
        {chartType === 'calories' && (
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Water Intake (L)</h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} formatter={(val: number) => [`${val}L`, 'Water']} />
                <Bar dataKey="water" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Macro distribution */}
        {chartType === 'macros' && stats && (
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Average Daily Macros</h3>
            <div className="grid grid-cols-2 gap-3">
              <MacroStatCard label="Protein" avg={stats.avgProtein} goal={goals.protein} color="bg-blue-500" />
              <MacroStatCard label="Carbs" avg={stats.avgCarbs} goal={goals.carbs} color="bg-amber-500" />
              <MacroStatCard label="Fat" avg={stats.avgFat} goal={goals.fat} color="bg-red-400" />
              <MacroStatCard label="Fiber" avg={Math.round(chartData.reduce((s,d) => s + (d as any).fiber, 0) / Math.max(chartData.filter(d => d.calories > 0).length, 1))} goal={goals.fiber} color="bg-purple-500" />
            </div>
          </div>
        )}

        {/* Weight change summary + trend prediction */}
        {chartType === 'weight' && weightStats && (
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Weight Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Starting</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{weightStats.first} {profile.weightUnit}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{weightStats.last} {profile.weightUnit}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Change</p>
                <div className={`flex items-center justify-center gap-1 font-bold ${weightStats.change < 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {weightStats.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {Math.abs(weightStats.change).toFixed(1)} {profile.weightUnit}
                </div>
              </div>
            </div>

            {trendPrediction && (
              <div className="mt-3 pt-3 border-t dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Trend Prediction</p>
                {trendPrediction.type === 'maintain' ? (
                  <p className="text-sm font-medium text-blue-500">Maintaining weight — change &lt;0.05 {profile.weightUnit}/week</p>
                ) : (
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    At current pace: <span className={trendPrediction.type === 'losing' ? 'text-green-500' : 'text-amber-500'}>
                      {trendPrediction.type === 'losing' ? '↓' : '↑'} {Math.abs(trendPrediction.ratePerWeek).toFixed(2)} {profile.weightUnit}/week
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pattern insights */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> AI Pattern Insights
            </h3>
            <button
              onClick={getInsights}
              disabled={insightsLoading}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-60"
            >
              {insightsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
              {insightsLoading ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
          {insights ? (
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">{insights}</p>
          ) : (
            <p className="text-sm text-gray-400">Click Analyze to get personalized insights about your nutrition patterns from the last 30 days.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard: React.FC<{ label: string; value: string; goal: string; color: string; icon: React.ReactNode }> = ({ label, value, goal, color, icon }) => (
  <div className="card p-3">
    <div className="flex items-center gap-2 mb-1">
      <span className={color}>{icon}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-400">Goal: {goal}</p>
  </div>
)

const MacroStatCard: React.FC<{ label: string; avg: number; goal: number; color: string }> = ({ label, avg, goal, color }) => {
  const pct = Math.round((avg / Math.max(goal, 1)) * 100)
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <span className="text-xs text-gray-500">{pct}%</span>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{avg}g</p>
      <p className="text-xs text-gray-400">Goal: {goal}g</p>
      <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}
