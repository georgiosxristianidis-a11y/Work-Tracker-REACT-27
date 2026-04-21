import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Clock, TrendingUp, Calendar } from 'lucide-react';
import { AppSettings, DOW_NAMES } from '../constants';
import { Entry } from '../lib/db';

interface HomeScreenProps {
  viewDate: Date;
  setViewDate: (date: Date) => void;
  getMonthName: (date: Date) => string;
  totalEarned: number;
  goalPct: number;
  totalHours: number;
  entries: Entry[];
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setScreen: (screen: 'home' | 'calendar' | 'chart' | 'settings') => void;
  setEditorDate: (date: string | null) => void;
  setEditorHours: (hours: number) => void;
  calcEarnings: (hours: number) => number;
  t: (key: string) => string;
  curSym: string;
}

export const HomeScreen = ({
  viewDate,
  setViewDate,
  getMonthName,
  totalEarned,
  goalPct,
  totalHours,
  entries,
  settings,
  setSettings,
  setScreen,
  setEditorDate,
  setEditorHours,
  calcEarnings,
  t,
  curSym
}: HomeScreenProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col min-w-0">
          <span className="text-[8px] font-bold text-[var(--t3)] uppercase tracking-widest leading-none mb-1 ml-1">
            {viewDate.getFullYear()}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-[var(--t1)] truncate">
            {getMonthName(viewDate)}
          </h1>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 rounded-xl border border-[var(--b)] bg-[var(--bg-1)] text-[var(--t2)] transition-colors hover:bg-[var(--b)]">
            <ChevronLeft size={20} strokeWidth={1.25} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 rounded-xl border border-[var(--b)] bg-[var(--bg-1)] text-[var(--t2)] transition-colors hover:bg-[var(--b)]">
            <ChevronRight size={20} strokeWidth={1.25} />
          </motion.button>
        </div>
      </div>

      <div className="relative">
        {/* Ambient Goal Glow */}
        <div 
          className="absolute inset-0 blur-3xl opacity-20 pointer-events-none transition-opacity duration-1000 rounded-[3rem]"
          style={{ 
            background: `radial-gradient(circle at center, var(--a) 0%, transparent 70%)`,
            opacity: Math.min(0.4, (goalPct / 100) * 0.4) 
          }}
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          className="relative p-8 rounded-[2rem] border border-[var(--b)] bg-[var(--bg-1)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden group transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        >
          {/* Subtle slow shimmer effect */}
          <motion.div 
            className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-[var(--a-bg)] to-transparent opacity-30 -skew-x-12 pointer-events-none"
            animate={{ x: ["-100%", "50%"] }}
            transition={{ duration: 6, ease: "linear", repeat: Infinity, repeatDelay: 4 }}
          />

          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--a)] opacity-80" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--t3)]">{t('Monthly Earnings')}</span>
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => setSettings(s => ({ ...s, privacyMode: !s.privacyMode }))} className="text-[var(--t3)] hover:text-[var(--t1)] transition-colors">
                {settings.privacyMode ? <EyeOff size={16} strokeWidth={1.25} /> : <Eye size={16} strokeWidth={1.25} />}
              </motion.button>
            </div>
            <div className={`flex items-baseline justify-center gap-1 py-2 text-[var(--t1)] transition-all duration-500 ${settings.privacyMode ? 'blur-xl opacity-20' : ''}`}>
              <span className="text-3xl text-[var(--t3)] font-light">{curSym}</span>
              <span className="text-6xl font-light tracking-tighter">{totalEarned.toFixed(2)}</span>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-[var(--t3)]">{t('Goal:')} {curSym}{settings.goal}</span>
                <span className="text-[var(--a)]">{goalPct}%</span>
              </div>
              <div className="h-1 bg-[var(--b)] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${goalPct}%` }}
                  className="h-full bg-[var(--a)]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('Total Hours'), val: totalHours, unit: 'h', icon: <Clock size={16} strokeWidth={1.25} /> },
          { label: t('Overtime'), val: entries.reduce((s, e) => s + Math.max(0, e.hours - settings.normal), 0), unit: 'h', icon: <TrendingUp size={16} strokeWidth={1.25} /> },
          { label: t('Days Worked'), val: entries.length, unit: 'd', icon: <Calendar size={16} strokeWidth={1.25} /> }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -2 }}
            className="p-5 rounded-2xl border border-[var(--b)] bg-[var(--bg-1)] shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          >
            <div className="text-[var(--t3)]">{stat.icon}</div>
            <div className="text-2xl font-bold text-[var(--t1)] tracking-tight">{stat.val}<span className="text-xs text-[var(--t3)] ml-0.5">{stat.unit}</span></div>
            <div className="text-[8px] font-black uppercase tracking-widest text-[var(--t3)]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--t3)]">{t('Recent Entries')}</span>
          <button onClick={() => setScreen('calendar')} className="text-[10px] font-bold text-[var(--a)] uppercase tracking-wider">{t('View All')}</button>
        </div>
        <div className="space-y-2">
          {entries.slice(-3).reverse().map((e, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setEditorDate(e.date); setEditorHours(e.hours); }} 
              className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--b)] bg-[var(--bg-1)] cursor-pointer hover:bg-[var(--b)] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--a)] flex flex-col items-center justify-center text-[var(--bg)]">
                <span className="text-sm font-black leading-none">{e.date.split('-')[2]}</span>
                <span className="text-[7px] font-bold uppercase opacity-80 tracking-widest">{DOW_NAMES[new Date(e.date).getDay() === 0 ? 6 : new Date(e.date).getDay() - 1]}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[var(--t1)] flex items-center gap-2">
                  {e.hours}h 
                  {e.hours > settings.normal && (
                    <span className="text-[8px] bg-[var(--green-bg)] text-[var(--green)] px-1.5 py-0.5 rounded uppercase">
                      +{e.hours - settings.normal}h OT
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[var(--t3)] font-medium">{e.date}</div>
              </div>
              <div className={`text-sm font-black text-[var(--t1)] ${settings.privacyMode ? 'blur-md' : ''}`}>{curSym}{calcEarnings(e.hours).toFixed(2)}</div>
            </motion.div>
          ))}
          {entries.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-12 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-1)] border border-[var(--b)] flex items-center justify-center mx-auto text-[var(--t3)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6V4c0-.5.5-1 1-1h4c.5 0 1 .5 1 1v2" />
                  <rect width="18" height="12" x="3" y="6" rx="2" />
                </svg>
              </div>
              <p className="text-xs font-medium text-[var(--t3)]">No entries for this month yet.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
