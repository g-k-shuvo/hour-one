import { useTodosStore } from '@/stores/todosStore';
import { useFocusSessionStore } from '@/stores/focusSessionStore';
import { useHabitStore, calculateStreak, getCompletionRate, isCompletedToday } from '@/stores/habitStore';
import { useBalanceStore, formatDuration } from '@/stores/balanceStore';
import { getTodayDate } from '@/lib/dateUtils';
import { SYSTEM_FOLDER_IDS } from '@/types';

// Task Metrics
export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  completedToday: number;
  completedThisWeek: number;
  completionRate: number;
  avgCompletionPerDay: number;
  tasksByPriority: { high: number; medium: number; low: number; none: number };
  overdueTasks: number;
}

export function getTaskMetrics(): TaskMetrics {
  const { tasks } = useTodosStore.getState();
  const today = getTodayDate();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const completedTasks = tasks.filter(t => t.completed);
  const completedToday = completedTasks.filter(t =>
    t.completedAt && t.completedAt.split('T')[0] === today
  );
  const completedThisWeek = completedTasks.filter(t =>
    t.completedAt && t.completedAt.split('T')[0] >= weekAgoStr
  );

  const incompleteTasks = tasks.filter(t => !t.completed);
  const overdueTasks = incompleteTasks.filter(t =>
    t.dueDate && t.dueDate < today
  );

  const tasksByPriority = {
    high: incompleteTasks.filter(t => t.priority === 'high').length,
    medium: incompleteTasks.filter(t => t.priority === 'medium').length,
    low: incompleteTasks.filter(t => t.priority === 'low').length,
    none: incompleteTasks.filter(t => !t.priority).length,
  };

  // Calculate avg completion per day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
  const completedLast30 = completedTasks.filter(t =>
    t.completedAt && t.completedAt.split('T')[0] >= thirtyDaysAgoStr
  );
  const avgCompletionPerDay = completedLast30.length / 30;

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    completedToday: completedToday.length,
    completedThisWeek: completedThisWeek.length,
    completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    avgCompletionPerDay: Math.round(avgCompletionPerDay * 10) / 10,
    tasksByPriority,
    overdueTasks: overdueTasks.length,
  };
}

// Focus Metrics
export interface FocusMetrics {
  totalSessions: number;
  totalFocusMinutes: number;
  totalBreakMinutes: number;
  sessionsToday: number;
  focusMinutesToday: number;
  sessionsThisWeek: number;
  focusMinutesThisWeek: number;
  avgSessionLength: number;
  longestSession: number;
}

export function getFocusMetrics(): FocusMetrics {
  const { sessions } = useFocusSessionStore.getState();
  const today = getTodayDate();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const todaySessions = sessions.filter(s => s.date === today);
  const weekSessions = sessions.filter(s => s.date >= weekAgoStr);

  const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.focusMinutes || 0), 0);
  const totalBreakMinutes = sessions.reduce((sum, s) => sum + (s.breakMinutes || 0), 0);
  const focusMinutesToday = todaySessions.reduce((sum, s) => sum + (s.focusMinutes || 0), 0);
  const focusMinutesThisWeek = weekSessions.reduce((sum, s) => sum + (s.focusMinutes || 0), 0);

  const sessionLengths = sessions.map(s => s.focusMinutes || 0).filter(m => m > 0);
  const avgSessionLength = sessionLengths.length > 0
    ? Math.round(sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length)
    : 0;
  const longestSession = sessionLengths.length > 0 ? Math.max(...sessionLengths) : 0;

  return {
    totalSessions: sessions.length,
    totalFocusMinutes,
    totalBreakMinutes,
    sessionsToday: todaySessions.length,
    focusMinutesToday,
    sessionsThisWeek: weekSessions.length,
    focusMinutesThisWeek,
    avgSessionLength,
    longestSession,
  };
}

// Habit Metrics
export interface HabitMetrics {
  totalHabits: number;
  activeHabits: number;
  completedToday: number;
  completionRateToday: number;
  avgCompletionRate: number;
  totalCurrentStreak: number;
  longestStreak: number;
  bestHabit: { name: string; streak: number } | null;
}

export function getHabitMetrics(): HabitMetrics {
  const { habits } = useHabitStore.getState();
  const activeHabits = habits.filter(h => !h.archived);

  const completedToday = activeHabits.filter(h => isCompletedToday(h)).length;
  const completionRateToday = activeHabits.length > 0
    ? Math.round((completedToday / activeHabits.length) * 100)
    : 0;

  const completionRates = activeHabits.map(h => getCompletionRate(h, 30));
  const avgCompletionRate = completionRates.length > 0
    ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
    : 0;

  const streaks = activeHabits.map(h => ({ name: h.name, streak: calculateStreak(h) }));
  const totalCurrentStreak = streaks.reduce((sum, s) => sum + s.streak, 0);
  const bestHabit = streaks.length > 0
    ? streaks.reduce((best, curr) => curr.streak > best.streak ? curr : best)
    : null;
  const longestStreak = bestHabit?.streak || 0;

  return {
    totalHabits: habits.length,
    activeHabits: activeHabits.length,
    completedToday,
    completionRateToday,
    avgCompletionRate,
    totalCurrentStreak,
    longestStreak,
    bestHabit: bestHabit && bestHabit.streak > 0 ? bestHabit : null,
  };
}

// Balance Metrics
export interface BalanceMetrics {
  currentScore: number;
  avgScoreThisWeek: number;
  totalWorkHoursToday: number;
  totalWorkHoursThisWeek: number;
  avgWorkHoursPerDay: number;
  totalBreakMinutesToday: number;
  workDaysThisWeek: number;
  scoreHistory: { date: string; score: number; workMinutes: number }[];
}

export function getBalanceMetrics(): BalanceMetrics {
  const { logs, goals, getWorkLifeScore, getTodayLog, getWeekLogs } = useBalanceStore.getState();

  const todayLog = getTodayLog();
  const weekLogs = getWeekLogs();
  const currentScore = getWorkLifeScore();

  // Calculate scores for each day
  const targetMinutes = goals.dailyWorkHours * 60;
  const maxMinutes = goals.dailyMaxHours * 60;

  const scoreHistory = weekLogs.map(log => {
    let score: number;
    if (log.workMinutes <= targetMinutes) {
      const progress = log.workMinutes / targetMinutes;
      score = Math.round(100 + (1 - progress) * 20);
    } else if (log.workMinutes <= maxMinutes) {
      const overProgress = (log.workMinutes - targetMinutes) / (maxMinutes - targetMinutes);
      score = Math.round(100 - overProgress * 30);
    } else {
      const criticalOverage = Math.min((log.workMinutes - maxMinutes) / 60, 4);
      score = Math.round(70 - criticalOverage * 10);
    }
    return { date: log.date, score, workMinutes: log.workMinutes };
  });

  const avgScoreThisWeek = scoreHistory.length > 0
    ? Math.round(scoreHistory.reduce((sum, s) => sum + s.score, 0) / scoreHistory.length)
    : 100;

  const totalWorkMinutesThisWeek = weekLogs.reduce((sum, l) => sum + l.workMinutes, 0);
  const workDaysThisWeek = weekLogs.filter(l => l.workMinutes > 0).length;
  const avgWorkHoursPerDay = workDaysThisWeek > 0
    ? Math.round((totalWorkMinutesThisWeek / workDaysThisWeek / 60) * 10) / 10
    : 0;

  return {
    currentScore,
    avgScoreThisWeek,
    totalWorkHoursToday: Math.round((todayLog.workMinutes / 60) * 10) / 10,
    totalWorkHoursThisWeek: Math.round((totalWorkMinutesThisWeek / 60) * 10) / 10,
    avgWorkHoursPerDay,
    totalBreakMinutesToday: todayLog.breakMinutes,
    workDaysThisWeek,
    scoreHistory,
  };
}

// Combined productivity score
export interface ProductivityScore {
  overall: number;
  taskScore: number;
  focusScore: number;
  habitScore: number;
  balanceScore: number;
}

export function getProductivityScore(): ProductivityScore {
  const taskMetrics = getTaskMetrics();
  const focusMetrics = getFocusMetrics();
  const habitMetrics = getHabitMetrics();
  const balanceMetrics = getBalanceMetrics();

  // Task score: based on completion rate and no overdue tasks
  const taskScore = Math.min(100, Math.max(0,
    taskMetrics.completionRate * 0.7 +
    (taskMetrics.overdueTasks === 0 ? 30 : Math.max(0, 30 - taskMetrics.overdueTasks * 5))
  ));

  // Focus score: based on daily focus time (target: 4 hours)
  const targetFocusMinutes = 240; // 4 hours
  const focusProgress = Math.min(focusMetrics.focusMinutesToday / targetFocusMinutes, 1);
  const focusScore = Math.round(focusProgress * 100);

  // Habit score: based on today's completion and avg rate
  const habitScore = Math.round(
    habitMetrics.completionRateToday * 0.6 +
    habitMetrics.avgCompletionRate * 0.4
  );

  // Balance score: direct from balance metrics (normalized to 0-100)
  const balanceScore = Math.min(100, Math.max(0, balanceMetrics.currentScore));

  // Overall: weighted average
  const overall = Math.round(
    taskScore * 0.25 +
    focusScore * 0.25 +
    habitScore * 0.25 +
    balanceScore * 0.25
  );

  return {
    overall,
    taskScore: Math.round(taskScore),
    focusScore,
    habitScore,
    balanceScore,
  };
}

// Weekly trends
export interface WeeklyTrend {
  date: string;
  dayName: string;
  tasksCompleted: number;
  focusMinutes: number;
  habitsCompleted: number;
  workMinutes: number;
}

export function getWeeklyTrends(): WeeklyTrend[] {
  const { tasks } = useTodosStore.getState();
  const { sessions } = useFocusSessionStore.getState();
  const { habits } = useHabitStore.getState();
  const { getWeekLogs } = useBalanceStore.getState();

  const weekLogs = getWeekLogs();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activeHabits = habits.filter(h => !h.archived);

  return weekLogs.map(log => {
    const date = new Date(log.date);
    const dayName = dayNames[date.getDay()];

    // Tasks completed on this day
    const tasksCompleted = tasks.filter(t =>
      t.completedAt && t.completedAt.split('T')[0] === log.date
    ).length;

    // Focus minutes on this day
    const focusMinutes = sessions
      .filter(s => s.date === log.date)
      .reduce((sum, s) => sum + (s.focusMinutes || 0), 0);

    // Habits completed on this day
    const habitsCompleted = activeHabits.filter(h =>
      h.completions.some(c => c.date === log.date && c.completed)
    ).length;

    return {
      date: log.date,
      dayName,
      tasksCompleted,
      focusMinutes,
      habitsCompleted,
      workMinutes: log.workMinutes,
    };
  });
}
