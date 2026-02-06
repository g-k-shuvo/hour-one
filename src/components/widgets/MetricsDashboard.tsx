import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckSquare,
  Target,
  Flame,
  Scale,
  Clock,
  Calendar,
  Award,
  Zap,
} from 'lucide-react';
import {
  getTaskMetrics,
  getFocusMetrics,
  getHabitMetrics,
  getBalanceMetrics,
  getProductivityScore,
  getWeeklyTrends,
  type WeeklyTrend,
} from '@/services/metricsService';
import { formatDuration } from '@/stores/balanceStore';

// Score Circle Component
function ScoreCircle({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(score, 100) / 100;
  const offset = circumference - progress * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#84cc16';
    if (s >= 40) return '#eab308';
    if (s >= 20) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs text-white/60 mt-1">{label}</span>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = 'accent',
}: {
  icon: typeof CheckSquare;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    accent: 'bg-accent/20 text-accent',
    green: 'bg-green-500/20 text-green-400',
    orange: 'bg-orange-500/20 text-orange-400',
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
          <Icon size={14} />
        </div>
        <span className="text-xs text-white/60">{label}</span>
        {trend && (
          <div className="ml-auto">
            {trend === 'up' && <TrendingUp size={14} className="text-green-400" />}
            {trend === 'down' && <TrendingDown size={14} className="text-red-400" />}
            {trend === 'neutral' && <Minus size={14} className="text-white/40" />}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-white">{value}</span>
        {subValue && <span className="text-xs text-white/40">{subValue}</span>}
      </div>
    </div>
  );
}

// Weekly Trends Chart
function WeeklyTrendsChart({ trends }: { trends: WeeklyTrend[] }) {
  const [metric, setMetric] = useState<'tasks' | 'focus' | 'habits' | 'work'>('tasks');

  const data = trends.map(t => {
    let value: number;
    let color: string;

    switch (metric) {
      case 'tasks':
        value = t.tasksCompleted;
        color = '#3b82f6';
        break;
      case 'focus':
        value = t.focusMinutes;
        color = '#8b5cf6';
        break;
      case 'habits':
        value = t.habitsCompleted;
        color = '#f97316';
        break;
      case 'work':
        value = t.workMinutes;
        color = '#22c55e';
        break;
    }

    return { label: t.dayName, value, color };
  });

  const today = new Date().toISOString().split('T')[0];
  const todayIndex = trends.findIndex(t => t.date === today);

  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-white">Weekly Trends</h4>
        <div className="flex gap-1">
          {(['tasks', 'focus', 'habits', 'work'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                metric === m
                  ? 'bg-white/20 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-1 h-24">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="relative w-full h-20 flex items-end justify-center">
              <div
                className={`w-full max-w-6 rounded-t transition-all ${i === todayIndex ? 'ring-2 ring-white/30' : ''}`}
                style={{
                  height: `${Math.max(0, (item.value / Math.max(...data.map(d => d.value), 1)) * 100)}%`,
                  minHeight: item.value > 0 ? 4 : 0,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className={`text-xs ${i === todayIndex ? 'text-white font-medium' : 'text-white/40'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center mt-2">
        <span className="text-xs text-white/40">
          {metric === 'tasks' && 'Tasks completed per day'}
          {metric === 'focus' && 'Focus minutes per day'}
          {metric === 'habits' && 'Habits completed per day'}
          {metric === 'work' && 'Work minutes per day'}
        </span>
      </div>
    </div>
  );
}

// Main Metrics Panel
export function MetricsPanel() {
  const taskMetrics = useMemo(() => getTaskMetrics(), []);
  const focusMetrics = useMemo(() => getFocusMetrics(), []);
  const habitMetrics = useMemo(() => getHabitMetrics(), []);
  const balanceMetrics = useMemo(() => getBalanceMetrics(), []);
  const productivityScore = useMemo(() => getProductivityScore(), []);
  const weeklyTrends = useMemo(() => getWeeklyTrends(), []);

  return (
    <div className="p-1 space-y-4">
      {/* Overall Productivity Score */}
      <div className="bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Award className="text-accent" size={18} />
          <span className="text-sm font-medium text-white">Productivity Score</span>
        </div>

        <div className="flex items-center justify-around">
          <ScoreCircle score={productivityScore.overall} label="Overall" size={90} />
          <div className="grid grid-cols-2 gap-3">
            <ScoreCircle score={productivityScore.taskScore} label="Tasks" size={60} />
            <ScoreCircle score={productivityScore.focusScore} label="Focus" size={60} />
            <ScoreCircle score={productivityScore.habitScore} label="Habits" size={60} />
            <ScoreCircle score={productivityScore.balanceScore} label="Balance" size={60} />
          </div>
        </div>
      </div>

      {/* Weekly Trends */}
      <WeeklyTrendsChart trends={weeklyTrends} />

      {/* Task Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckSquare size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-white">Tasks</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={CheckSquare}
            label="Completed Today"
            value={taskMetrics.completedToday}
            color="blue"
          />
          <StatCard
            icon={Calendar}
            label="This Week"
            value={taskMetrics.completedThisWeek}
            subValue="tasks"
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="Completion Rate"
            value={`${taskMetrics.completionRate}%`}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Overdue"
            value={taskMetrics.overdueTasks}
            color={taskMetrics.overdueTasks > 0 ? 'orange' : 'green'}
          />
        </div>
      </div>

      {/* Focus Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-purple-400" />
          <span className="text-sm font-medium text-white">Focus</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Clock}
            label="Today"
            value={formatDuration(focusMetrics.focusMinutesToday)}
            color="purple"
          />
          <StatCard
            icon={Calendar}
            label="This Week"
            value={formatDuration(focusMetrics.focusMinutesThisWeek)}
            color="purple"
          />
          <StatCard
            icon={Zap}
            label="Sessions Today"
            value={focusMetrics.sessionsToday}
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Session"
            value={formatDuration(focusMetrics.avgSessionLength)}
            color="purple"
          />
        </div>
      </div>

      {/* Habit Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-medium text-white">Habits</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={CheckSquare}
            label="Completed Today"
            value={`${habitMetrics.completedToday}/${habitMetrics.activeHabits}`}
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            label="Today's Rate"
            value={`${habitMetrics.completionRateToday}%`}
            color="orange"
          />
          <StatCard
            icon={Flame}
            label="Active Streaks"
            value={habitMetrics.totalCurrentStreak}
            subValue="days total"
            color="orange"
          />
          {habitMetrics.bestHabit && (
            <StatCard
              icon={Award}
              label="Best Streak"
              value={habitMetrics.bestHabit.streak}
              subValue={habitMetrics.bestHabit.name}
              color="orange"
            />
          )}
        </div>
      </div>

      {/* Balance Stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Scale size={16} className="text-green-400" />
          <span className="text-sm font-medium text-white">Balance</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Scale}
            label="Current Score"
            value={balanceMetrics.currentScore}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Week Average"
            value={balanceMetrics.avgScoreThisWeek}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Work Today"
            value={`${balanceMetrics.totalWorkHoursToday}h`}
            color="green"
          />
          <StatCard
            icon={Calendar}
            label="Work This Week"
            value={`${balanceMetrics.totalWorkHoursThisWeek}h`}
            subValue={`${balanceMetrics.workDaysThisWeek} days`}
            color="green"
          />
        </div>
      </div>
    </div>
  );
}

// Metrics Button for Dashboard
export function MetricsButton() {
  const productivityScore = useMemo(() => getProductivityScore(), []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10">
      <BarChart3 size={14} className={getScoreColor(productivityScore.overall)} />
      <span className={`text-sm font-medium ${getScoreColor(productivityScore.overall)}`}>
        {productivityScore.overall}
      </span>
    </div>
  );
}

// Header Actions
export function MetricsHeaderActions({ onClose: _onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center gap-1">
      {/* Could add refresh button or date range selector here */}
    </div>
  );
}
