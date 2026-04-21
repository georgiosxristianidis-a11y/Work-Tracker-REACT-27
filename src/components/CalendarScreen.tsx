import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Save, Trash, Trash2, Wand2 } from 'lucide-react';
import { DOW_NAMES, MONTH_NAMES, MONTH_NAMES_RUS, MONTH_NAMES_GR } from '../constants';
import { Entry } from '../lib/db';

interface CalendarScreenProps {
  viewDate: Date;
  setViewDate: (date: Date) => void;
  entries: Entry[];
  settings: any;
  t: (key: string) => string;
  editorDate: string | null;
  setEditorDate: (date: string | null) => void;
  editorHours: number;
  setEditorHours: (hours: number) => void;
  defaultEditorHours: number;
  saveEntry: () => void;
  clearTap: { trigger: () => void; isConfirming: boolean };
  clearMonthTap: { trigger: () => void; isConfirming: boolean };
  haptic: (pattern?: number | number[]) => void;
  openQuickFill: () => void;
}

export const CalendarScreen = ({
  viewDate, setViewDate, entries, settings, t,
  editorDate, setEditorDate, editorHours, setEditorHours, defaultEditorHours,
  saveEntry, clearTap, clearMonthTap, haptic, openQuickFill
}: CalendarScreenProps) => {
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDow = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const today = new Date().toISOString().split('T')[0];
  
  const currentMonthPrefix = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
  const selectedDaysCount = entries.filter(e => e.date.startsWith(currentMonthPrefix) && e.hours > 0).length;

  const entryMap = entries.reduce((acc, e) => ({ ...acc, [e.date]: e.hours }), {} as any);

  return (
    <div className="space-y-6">
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[8px] font-bold text-[var(--t3)] uppercase tracking-widest leading-none mb-1 ml-1">
            {viewDate.getFullYear()}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-[var(--t1)] truncate">
            {(() => {
              const mNames = settings.language === 'RUS' ? MONTH_NAMES_RUS : settings.language === 'GR' ? MONTH_NAMES_GR : MONTH_NAMES;
              return mNames[viewDate.getMonth()];
            })()}
          </h1>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <AnimatePresence>
            {selectedDaysCount > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                className="py-2 px-3 rounded-2xl border border-[var(--b)] bg-[var(--bg-1)] flex flex-col items-center gap-1 shadow-sm min-w-[3.5rem]"
              >
                <span className="text-xl font-black text-[var(--t1)] leading-none">{selectedDaysCount}</span>
                <span className="text-[8px] font-medium uppercase tracking-widest text-[var(--t3)] leading-none">{t('Days')}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 rounded-xl border border-[var(--b)] bg-[var(--bg-1)] text-[var(--t2)] transition-colors hover:bg-[var(--b)]">
              <ChevronLeft size={20} strokeWidth={1.25} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 rounded-xl border border-[var(--b)] bg-[var(--bg-1)] text-[var(--t2)] transition-colors hover:bg-[var(--b)]">
              <ChevronRight size={20} strokeWidth={1.25} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-3 bg-[var(--bg-1)] border border-[var(--b)] rounded-[2rem] shadow-sm relative">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center pb-2 flex justify-center opacity-60"
        >
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="relative flex items-center justify-center w-3 h-3">
              <motion.div 
                animate={{ scale: [1, 3.5], opacity: [0.8, 0], borderWidth: ["2px", "0px"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-full h-full rounded-full border border-[var(--t3)]"
              />
              <motion.div 
                animate={{ scale: [1, 3.5], opacity: [0.8, 0], borderWidth: ["2px", "0px"] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 1.25, ease: "easeOut" }}
                className="absolute w-full h-full rounded-full border border-[var(--t3)]"
              />
              <div className="relative w-1.5 h-1.5 rounded-full bg-[var(--t3)]" />
            </div>
            <span className="text-[8px] font-medium text-[var(--t3)] uppercase tracking-widest translate-y-[1px]">
              {t('Tap a day to edit')}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-7 gap-1 touch-pan-y"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.05}
          onDragEnd={(e, { offset, velocity }) => {
            if (offset.x > 50 || velocity.x > 300) {
              haptic(10);
              setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)));
            } else if (offset.x < -50 || velocity.x < -300) {
              haptic(10);
              setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)));
            }
          }}
        >
          {DOW_NAMES.map(d => <div key={d} className="text-center text-[8px] font-black uppercase tracking-widest text-[var(--t3)] py-2 select-none">{d}</div>)}
          {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ds = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hours = entryMap[ds];
            const isToday = ds === today;
            
            return (
              <motion.button 
                key={day} 
                whileTap={{ scale: 0.9 }}
                onClick={() => { haptic(10); setEditorDate(ds); setEditorHours(hours || defaultEditorHours); }}
                className={`
                  relative aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all select-none
                  ${hours && hours > 0 
                    ? 'bg-[var(--a-bg)] border-[var(--a-b)] text-[var(--a)]' 
                    : isToday 
                      ? 'bg-[var(--bg-1)] border-[var(--t1)] text-[var(--t1)]' 
                      : 'bg-transparent border-transparent text-[var(--t2)] hover:bg-[var(--b)]'}
                `}
              >
                <span className={`text-base font-bold ${hours && hours > 0 ? 'text-[var(--t1)]' : ''}`}>{day}</span>
                {hours && hours > 0 ? (
                  <span className="text-[8px] font-black absolute bottom-1.5">{hours}h</span>
                ) : null}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div className="mt-4">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={openQuickFill} 
          className="w-full h-14 rounded-2xl border border-[var(--b)] bg-[var(--bg-1)] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 text-[var(--t2)] transition-colors hover:bg-[var(--a-bg)] hover:text-[var(--a)] hover:border-[var(--a-b)]"
        >
          <Wand2 size={18} className="text-[var(--a)]" strokeWidth={2} />
          {t('Quick Fill')}
        </motion.button>
      </div>
    </div>
  );
};
