import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Scale,
  Play,
  Pause,
  Coffee,
  Clock,
  X,
  Settings,
  Bell,
  BellOff,
} from 'lucide-react';
import {
  useBalanceStore,
  formatDuration,
  getScoreLabel,
  getScoreDescription,
} from '@/stores/balanceStore';
import { Toggle } from '@/components/ui/Toggle';

// Score Ring Component
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const { label, color } = getScoreLabel(score);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(score, 120) / 120; // Cap visual at 120
  const offset = circumference - progress * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs text-white/60">{label}</span>
      </div>
    </div>
  );
}

// Week Chart Component
function WeekChart() {
  const { getWeekLogs, goals } = useBalanceStore();
  const logs = getWeekLogs();
  const targetMinutes = goals.dailyWorkHours * 60;
  const maxMinutes = Math.max(...logs.map(l => l.workMinutes), targetMinutes);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-white/70 mb-3">This Week</h4>
      <div className="flex items-end justify-between gap-1 h-24">
        {logs.map((log) => {
          const date = new Date(log.date);
          const dayName = dayNames[date.getDay()];
          const isToday = log.date === new Date().toISOString().split('T')[0];
          const isWorkDay = goals.workDays.includes(date.getDay());
          const height = maxMinutes > 0 ? (log.workMinutes / maxMinutes) * 100 : 0;
          const isOverTarget = log.workMinutes > targetMinutes;

          return (
            <div key={log.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full h-20 flex items-end justify-center">
                {/* Target line */}
                {isWorkDay && (
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-white/20"
                    style={{ bottom: `${(targetMinutes / maxMinutes) * 100}%` }}
                  />
                )}
                {/* Bar */}
                <div
                  className={`w-full max-w-6 rounded-t transition-all ${
                    isOverTarget
                      ? 'bg-orange-500'
                      : isWorkDay
                      ? 'bg-accent'
                      : 'bg-white/20'
                  } ${isToday ? 'ring-2 ring-white/30' : ''}`}
                  style={{ height: `${height}%`, minHeight: log.workMinutes > 0 ? 4 : 0 }}
                  title={`${formatDuration(log.workMinutes)}`}
                />
              </div>
              <span className={`text-xs ${isToday ? 'text-white font-medium' : 'text-white/40'}`}>
                {dayName}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-white/40">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent" />
          Work
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          Over target
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-0.5 border-t border-dashed border-white/40" />
          Target
        </span>
      </div>
    </div>
  );
}

// Break Reminder Notification
export function BreakReminderNotification() {
  const { shouldShowBreakReminder, dismissBreakReminder, startBreak, goals } = useBalanceStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(shouldShowBreakReminder());
    }, 60000); // Check every minute

    // Initial check
    setIsVisible(shouldShowBreakReminder());

    return () => clearInterval(interval);
  }, [shouldShowBreakReminder]);

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-white/10 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Coffee className="text-accent" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-white mb-1">Time for a break!</h4>
            <p className="text-sm text-white/60 mb-3">
              You've been working for {goals.breakInterval} minutes. A {goals.breakDuration}-minute break can help you stay focused.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  startBreak();
                  setIsVisible(false);
                }}
                className="flex-1 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Take a break
              </button>
              <button
                onClick={() => {
                  dismissBreakReminder();
                  setIsVisible(false);
                }}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              dismissBreakReminder();
              setIsVisible(false);
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X size={16} className="text-white/40" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Settings Modal
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { goals, setGoals, breakRemindersEnabled, setBreakReminders } = useBalanceStore();

  if (!isOpen) return null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Balance Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Work Hours */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Daily Work Target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="4"
                max="12"
                step="0.5"
                value={goals.dailyWorkHours}
                onChange={(e) => setGoals({ dailyWorkHours: parseFloat(e.target.value) })}
                className="flex-1 accent-accent"
              />
              <span className="text-white w-16 text-right">{goals.dailyWorkHours}h</span>
            </div>
          </div>

          {/* Max Hours */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Daily Maximum (Warning)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={goals.dailyWorkHours}
                max="14"
                step="0.5"
                value={goals.dailyMaxHours}
                onChange={(e) => setGoals({ dailyMaxHours: parseFloat(e.target.value) })}
                className="flex-1 accent-orange-500"
              />
              <span className="text-white w-16 text-right">{goals.dailyMaxHours}h</span>
            </div>
          </div>

          {/* Work Days */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Work Days
            </label>
            <div className="flex gap-1">
              {dayNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const newDays = goals.workDays.includes(index)
                      ? goals.workDays.filter(d => d !== index)
                      : [...goals.workDays, index].sort();
                    setGoals({ workDays: newDays });
                  }}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                    goals.workDays.includes(index)
                      ? 'bg-accent text-white'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Break Reminders */}
          <div className="border-t border-white/10 pt-4">
            <Toggle
              enabled={breakRemindersEnabled}
              onChange={() => setBreakReminders(!breakRemindersEnabled)}
              title="Break Reminders"
              description="Get reminded to take breaks"
            />
          </div>

          {breakRemindersEnabled && (
            <>
              {/* Break Interval */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Remind after
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="30"
                    max="180"
                    step="15"
                    value={goals.breakInterval}
                    onChange={(e) => setGoals({ breakInterval: parseInt(e.target.value) })}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-white w-20 text-right">{goals.breakInterval} min</span>
                </div>
              </div>

              {/* Break Duration */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Suggested break
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={goals.breakDuration}
                    onChange={(e) => setGoals({ breakDuration: parseInt(e.target.value) })}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-white w-20 text-right">{goals.breakDuration} min</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Main Balance Panel Component
export function BalancePanel() {
  const {
    activeSession,
    startWork,
    stopWork,
    startBreak,
    endBreak,
    getTodayLog,
    getWorkLifeScore,
    goals,
  } = useBalanceStore();

  const [showSettings, setShowSettings] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const todayLog = getTodayLog();
  const score = getWorkLifeScore();
  const targetMinutes = goals.dailyWorkHours * 60;

  // Update elapsed time for active session
  useEffect(() => {
    if (!activeSession) {
      setElapsed(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeSession.startTime);
      const now = new Date();
      setElapsed(Math.round((now.getTime() - start.getTime()) / 60000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const isWorking = activeSession?.type === 'work';
  const isOnBreak = activeSession?.type === 'break';

  return (
    <div className="p-1">
      {/* Header with settings */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="text-accent" size={18} />
          <span className="text-sm font-medium text-white">Work-Life Balance</span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Score and Status */}
      <div className="flex items-center gap-4 mb-4">
        <ScoreRing score={score} size={100} />
        <div className="flex-1">
          <p className="text-sm text-white/60 mb-2">
            {getScoreDescription(score, todayLog.workMinutes, targetMinutes)}
          </p>
          <div className="flex items-center gap-3 text-sm">
            <div>
              <span className="text-white font-medium">{formatDuration(todayLog.workMinutes)}</span>
              <span className="text-white/40 ml-1">worked</span>
            </div>
            {todayLog.breakMinutes > 0 && (
              <div>
                <span className="text-white font-medium">{formatDuration(todayLog.breakMinutes)}</span>
                <span className="text-white/40 ml-1">break</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Session */}
      {activeSession && (
        <div className={`p-3 rounded-xl mb-4 ${
          isWorking ? 'bg-accent/20 border border-accent/30' : 'bg-green-500/20 border border-green-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isWorking ? (
                <Clock className="text-accent" size={16} />
              ) : (
                <Coffee className="text-green-400" size={16} />
              )}
              <span className="text-sm font-medium text-white">
                {isWorking ? 'Working' : 'On Break'}
              </span>
            </div>
            <span className="text-lg font-bold text-white">{formatDuration(elapsed)}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        {!activeSession && (
          <>
            <button
              onClick={() => startWork()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors"
            >
              <Play size={16} />
              <span>Start Work</span>
            </button>
            <button
              onClick={() => startBreak()}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
            >
              <Coffee size={16} />
              <span>Break</span>
            </button>
          </>
        )}

        {isWorking && (
          <>
            <button
              onClick={stopWork}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
            >
              <Pause size={16} />
              <span>Stop Work</span>
            </button>
            <button
              onClick={startBreak}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium rounded-xl transition-colors"
            >
              <Coffee size={16} />
              <span>Break</span>
            </button>
          </>
        )}

        {isOnBreak && (
          <button
            onClick={endBreak}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors"
          >
            <Play size={16} />
            <span>End Break & Resume</span>
          </button>
        )}
      </div>

      {/* Week Chart */}
      <WeekChart />

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

// Balance Button for Dashboard
export function BalanceButton() {
  const { activeSession, getWorkLifeScore, getTodayLog } = useBalanceStore();
  const [elapsed, setElapsed] = useState(0);

  const score = getWorkLifeScore();
  const { color } = getScoreLabel(score);
  const todayLog = getTodayLog();

  // Update elapsed time
  useEffect(() => {
    if (!activeSession) {
      setElapsed(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeSession.startTime);
      const now = new Date();
      setElapsed(Math.round((now.getTime() - start.getTime()) / 60000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const isWorking = activeSession?.type === 'work';

  return (
    <div className="flex items-center gap-2">
      {/* Score indicator */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10"
        title={`Balance Score: ${score}`}
      >
        <Scale size={14} style={{ color }} />
        <span className="text-sm font-medium text-white">{score}</span>
      </div>

      {/* Active session indicator */}
      {activeSession && (
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
            isWorking ? 'bg-accent/20 text-accent' : 'bg-green-500/20 text-green-400'
          }`}
        >
          {isWorking ? <Clock size={14} /> : <Coffee size={14} />}
          <span className="text-sm font-medium">{formatDuration(elapsed)}</span>
        </div>
      )}

      {/* Today's total if not active */}
      {!activeSession && todayLog.workMinutes > 0 && (
        <span className="text-sm text-white/50">
          {formatDuration(todayLog.workMinutes)} today
        </span>
      )}
    </div>
  );
}

// Header Actions for PopupPanel
export function BalanceHeaderActions({ onClose: _onClose }: { onClose: () => void }) {
  const { breakRemindersEnabled, setBreakReminders } = useBalanceStore();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setBreakReminders(!breakRemindersEnabled)}
        className={`p-1.5 rounded-lg transition-colors ${
          breakRemindersEnabled
            ? 'text-accent hover:bg-accent/20'
            : 'text-white/40 hover:bg-white/10 hover:text-white/60'
        }`}
        title={breakRemindersEnabled ? 'Disable break reminders' : 'Enable break reminders'}
      >
        {breakRemindersEnabled ? <Bell size={16} /> : <BellOff size={16} />}
      </button>
    </div>
  );
}
