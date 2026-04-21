import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Sparkles, Plus, Calendar } from 'lucide-react';
import { AppSettings, MONTH_NAMES, MONTH_NAMES_RUS, MONTH_NAMES_GR } from '../constants';
import { Entry } from '../lib/db';

const AnalyticsChart = React.lazy(() => import('./AnalyticsChart'));

interface AnalyticsScreenProps {
  t: (key: string) => string;
  aiLangOverride: string | null;
  setAiLangOverride: React.Dispatch<React.SetStateAction<string | null>>;
  settings: AppSettings;
  haptic: (pattern?: number | number[]) => void;
  generateAiInsight: () => void;
  isAiLoading: boolean;
  aiInsight: string | null;
  setAiInsight: React.Dispatch<React.SetStateAction<string | null>>;
  goalPct: number;
  entries: Entry[];
  totalHours: number;
  curSym: string;
  chartPeriod: 6 | 12;
  setChartPeriod: React.Dispatch<React.SetStateAction<6 | 12>>;
  chartData: any[];
}

export const AnalyticsScreen = ({
  t, aiLangOverride, setAiLangOverride, settings, haptic, generateAiInsight,
  isAiLoading, aiInsight, setAiInsight, goalPct, entries, totalHours,
  curSym, chartPeriod, setChartPeriod, chartData
}: AnalyticsScreenProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-[var(--t1)]">{t('Analytics')}</h1>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9, y: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            onClick={() => {
              haptic(10);
              const langs: ('ENG' | 'RUS' | 'GR')[] = ['ENG', 'RUS', 'GR'];
              const current = aiLangOverride || settings.language;
              const nextLang = langs[(langs.indexOf(current as 'ENG'|'RUS'|'GR') + 1) % langs.length];
              setAiLangOverride(nextLang);
            }}
            className="h-9 px-3 flex items-center justify-center rounded-xl border border-[var(--b)] bg-[var(--bg-1)] text-[var(--t2)] transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            {aiLangOverride || settings.language}
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9, y: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            onClick={generateAiInsight} 
            disabled={isAiLoading}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--a)] text-[var(--bg)] disabled:opacity-50"
          >
            {isAiLoading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {aiInsight && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-8 rounded-[2.5rem] bg-[var(--bg-1)] border border-[var(--b)] text-[var(--t1)] relative overflow-hidden shadow-sm"
          >
            <div className="text-sm font-medium text-justify leading-loose tracking-tight space-y-4 text-[var(--t2)] px-2">
              {aiInsight.split('\n').filter(line => line.trim().length > 0).map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <button 
              onClick={() => setAiInsight(null)} 
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--b)] transition-colors opacity-40 hover:opacity-100"
            >
              <Plus size={16} className="rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 rounded-[2rem] border border-[var(--b)] bg-[var(--bg-1)] flex flex-col items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--a)] rounded-full blur-[80px]" />
        </div>
        
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(200,181,96,0.3)]">
            <circle cx={96} cy={96} r={80} fill="none" stroke="var(--b)" strokeWidth={8} />
            <motion.circle 
              cx={96} cy={96} r={80} fill="none" stroke="var(--a)" strokeWidth={8} 
              strokeDasharray={502}
              initial={{ strokeDashoffset: 502 }}
              animate={{ strokeDashoffset: 502 - (502 * (goalPct || 0)) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="text-center space-y-1 relative z-10">
            <div className="text-4xl font-black text-[var(--t1)]">{goalPct}%</div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-[var(--t3)]">{t('of Goal')}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 w-full gap-4 pt-6 border-t border-[var(--b)]">
          <div className="text-center space-y-1">
            <div className="text-lg font-black text-[var(--t1)]">{entries.length}</div>
            <div className="text-[7px] font-bold uppercase tracking-widest text-[var(--t3)]">{t('Days')}</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-lg font-black text-[var(--t1)]">{totalHours}h</div>
            <div className="text-[7px] font-bold uppercase tracking-widest text-[var(--t3)]">{t('Hours')}</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-lg font-black text-[var(--t1)]">{curSym}{settings.goal}</div>
            <div className="text-[7px] font-bold uppercase tracking-widest text-[var(--t3)]">{t('Goal')}</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-[2rem] border border-[var(--b)] bg-[var(--bg-1)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--t3)]">{t('Monthly Earnings')}</span>
          <div className="flex bg-[var(--bg)] p-1 rounded-xl border border-[var(--b)]">
            {[6, 12].map((p) => (
              <button
                key={p}
                onClick={() => {
                  haptic(10);
                  setChartPeriod(p as 6 | 12);
                }}
                className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all ${
                  chartPeriod === p 
                    ? 'bg-[var(--a)] text-[var(--bg)] shadow-lg' 
                    : 'text-[var(--t3)] hover:text-[var(--t1)]'
                }`}
              >
                {p}M
              </button>
            ))}
          </div>
        </div>
        <div className="h-48 w-full min-h-[12rem]">
          <Suspense fallback={<div className="w-full h-full flex flex-col items-center justify-center animate-pulse"><div className="w-5 h-5 border-2 border-[var(--a)] border-t-transparent rounded-full animate-spin"></div></div>}>
            <AnalyticsChart chartData={chartData} curSym={curSym} goal={settings.goal} t={t} />
          </Suspense>
        </div>
      </div>

      {/* Mini Heatmap: Shows last 14 weeks of activity */}
      <div className="p-6 rounded-[2rem] border border-[var(--b)] bg-[var(--bg-1)] space-y-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[var(--a)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--t3)]">{t('Activity Map')}</span>
        </div>
        <div className="flex justify-end gap-1 overflow-x-auto scrollbar-hide py-2">
          {(() => {
            const cols = 14; 
            const today = new Date();
            const grid = [];
            const eMap = new Map(entries.map(e => [e.date, e.hours]));
            
            for(let i = cols - 1; i >= 0; i--) {
              const week = [];
              for(let j = 0; j < 7; j++) {
                const d = new Date(today);
                d.setDate(d.getDate() - (i * 7 + (6 - j)));
                const ds = d.toISOString().split('T')[0];
                const hours = eMap.get(ds) || 0;
                let intensityClass = 'bg-[var(--b)] opacity-30';
                if(hours > 0 && hours <= 4) intensityClass = 'bg-[var(--a)] opacity-40';
                else if(hours > 4 && hours <= 8) intensityClass = 'bg-[var(--a)] opacity-70';
                else if(hours > 8) intensityClass = 'bg-[var(--a)] opacity-100 shadow-[0_0_8px_var(--a)] shadow-[var(--a)]/50';
                
                week.push(
                  <div 
                    key={ds}
                    className={`w-3.5 h-3.5 rounded-[3px] transition-all hover:scale-125 hover:z-10 ${intensityClass}`}
                    title={`${ds}: ${hours}h`}
                  />
                );
              }
              grid.push(<div key={i} className="flex flex-col gap-1">{week}</div>);
            }
            return grid;
          })()}
        </div>
      </div>

    </div>
  );
};
