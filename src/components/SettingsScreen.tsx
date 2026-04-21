import React from 'react';
import { motion } from 'motion/react';
import { Minus, Plus, Palette, Check, RefreshCw, AlertTriangle, Database, FileText, Download, Trash, ChevronRight } from 'lucide-react';
import { db } from '../lib/db';
import { AppSettings } from '../constants';

interface SettingsScreenProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  t: (key: string) => string;
  curSym: string;
  haptic: (pattern?: number | number[], enabled?: boolean) => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncErrorMsg: string;
  lastSynced: string;
  syncTapActual: { trigger: () => void; isConfirming: boolean };
  deleteAllTap: { trigger: () => void; isConfirming: boolean };
  toggleTheme: () => void;
  exportCSV: () => void;
  exportTXT: () => void;
  exportPDF: (period: '6months' | 'year') => void;
  shareBackup: () => void;
  isExporting: boolean;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SettingsScreen = ({
  settings, setSettings, t, curSym, haptic, syncStatus, syncErrorMsg,
  lastSynced, syncTapActual, deleteAllTap, toggleTheme,
  exportCSV, exportTXT, exportPDF, shareBackup, isExporting, addToast
}: SettingsScreenProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-[var(--t1)]">{t('Settings')}</h1>
      
      <div className="space-y-4">
        <div className="p-5 rounded-3xl bg-[var(--bg-1)] border border-[var(--b)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--a-bg)] flex items-center justify-center text-[var(--a)]">
                <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" whileTap={{ scale: 0.9 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <motion.path d="M7 11V7a5 5 0 0 1 10 0v4" initial={{ y: 0 }} whileTap={{ y: 2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} />
                </motion.svg>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-[var(--t1)]">{t('Privacy & Security')}</div>
                <div className="text-[10px] text-[var(--t3)] font-medium leading-relaxed">{t('E2E Encryption & Blurring')}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--t2)]">{t('Privacy Mode (Blur)')}</span>
              <button 
                onClick={() => setSettings(s => ({ ...s, privacyMode: !s.privacyMode }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.privacyMode ? 'bg-[var(--a)]' : 'bg-[var(--b)]'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.privacyMode ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-1)] border border-[var(--b)] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--a-bg)] flex items-center justify-center text-[var(--a)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6V4c0-.5.5-1 1-1h4c.5 0 1 .5 1 1v2" />
                <rect width="18" height="12" x="3" y="6" rx="2" />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-[var(--t1)]">{t('Salary & Goal')}</div>
              <div className="text-[10px] text-[var(--t3)] font-medium leading-relaxed">{t('Manage your target revenue')}</div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="settings-rate" className="text-[8px] font-black uppercase tracking-widest text-[var(--t3)] ml-2">{t('Hourly Rate')} ({curSym})</label>
              <div className="flex items-center bg-[var(--bg)] rounded-3xl border border-[var(--b)] p-1.5 h-16">
                <motion.button 
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { haptic(15); setSettings(s => ({ ...s, rate: Math.max(0, s.rate - 1) })); }} 
                  className="w-12 h-12 rounded-2xl bg-[var(--bg-1)] border border-[var(--b)] text-[var(--t1)] flex items-center justify-center shadow-sm"
                >
                  <Minus size={20} strokeWidth={3} />
                </motion.button>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <input 
                    id="settings-rate"
                    name="rate"
                    type="number" 
                    value={settings.rate} 
                    onChange={e => setSettings(s => ({ ...s, rate: parseFloat(e.target.value) || 0 }))} 
                    className="w-full bg-transparent text-center text-2xl font-black text-[var(--t1)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                </div>
                <motion.button 
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { haptic(15); setSettings(s => ({ ...s, rate: s.rate + 1 })); }} 
                  className="w-12 h-12 rounded-2xl bg-[var(--bg-1)] border border-[var(--b)] text-[var(--t1)] flex items-center justify-center shadow-sm"
                >
                  <Plus size={20} strokeWidth={3} />
                </motion.button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="settings-goal" className="text-[8px] font-black uppercase tracking-widest text-[var(--t3)] ml-2">{t('Goal')} ({curSym}/mo)</label>
              <div className="flex items-center bg-[var(--bg)] rounded-3xl border border-[var(--b)] p-1.5 h-16">
                <motion.button 
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { haptic(15); setSettings(s => ({ ...s, goal: Math.max(0, s.goal - 50) })); }} 
                  className="w-12 h-12 rounded-2xl bg-[var(--bg-1)] border border-[var(--b)] text-[var(--t1)] flex items-center justify-center shadow-sm"
                >
                  <Minus size={20} strokeWidth={3} />
                </motion.button>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <input 
                    id="settings-goal"
                    name="goal"
                    type="number" 
                    value={settings.goal} 
                    onChange={e => setSettings(s => ({ ...s, goal: parseFloat(e.target.value) || 0 }))} 
                    className="w-full bg-transparent text-center text-2xl font-black text-[var(--t1)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                </div>
                <motion.button 
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { haptic(15); setSettings(s => ({ ...s, goal: s.goal + 50 })); }} 
                  className="w-12 h-12 rounded-2xl bg-[var(--bg-1)] border border-[var(--b)] text-[var(--t1)] flex items-center justify-center shadow-sm"
                >
                  <Plus size={20} strokeWidth={3} />
                </motion.button>
              </div>
            </div>
          </div>
          <button onClick={async () => { await db.setSetting('settings', settings); addToast(t('Save'), 'success'); }} className="w-full h-14 rounded-2xl bg-[var(--t1)] text-[var(--bg)] font-black uppercase tracking-widest text-xs active:scale-95 transition-all">{t('Save')}</button>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-1)] border border-[var(--b)] space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--a-bg)] flex items-center justify-center text-[var(--a)]"><Palette size={18} /></div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-[var(--t1)]">{t('Appearance')}</div>
              <div className="text-[10px] text-[var(--t3)] font-medium leading-relaxed">{t('Customize the interface')}</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <button onClick={toggleTheme} className="h-12 rounded-xl border border-[var(--b)] text-[10px] font-black uppercase tracking-widest text-[var(--t2)] active:scale-95 transition-all">{settings.theme}</button>
            <button onClick={() => setSettings(s => ({ ...s, language: s.language === 'ENG' ? 'RUS' : s.language === 'RUS' ? 'GR' : 'ENG' }))} className="h-12 rounded-xl border border-[var(--b)] text-[10px] font-black uppercase tracking-widest text-[var(--t2)] active:scale-95 transition-all">{settings.language}</button>
            <button onClick={() => setSettings(s => ({ ...s, currency: s.currency === 'EUR' ? 'RUB' : 'EUR' }))} className="h-12 rounded-xl border border-[var(--b)] text-[10px] font-black uppercase tracking-widest text-[var(--t2)] active:scale-95 transition-all">{settings.currency}</button>
            <button 
              onClick={() => {
                const newVal = !settings.hapticEnabled;
                setSettings(s => ({ ...s, hapticEnabled: newVal }));
                if (newVal) haptic(30, true);
              }} 
              className={`h-12 rounded-xl border border-[var(--b)] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all ${settings.hapticEnabled ? 'text-[var(--a)]' : 'text-[var(--t3)]'}`}
            >
              {settings.hapticEnabled ? t('ON') : t('OFF')}
            </button>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-1)] border border-[var(--b)] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--a-bg)] flex items-center justify-center text-[var(--a)]">
              <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" whileTap={{ scale: 0.9 }}>
                <motion.path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" animate={{ y: syncStatus === 'syncing' ? [-1, 1, -1] : 0 }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                <motion.path d="M12 12v6" animate={{ y: syncStatus === 'syncing' ? [-2, 2, -2] : 0 }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
                <motion.path d="m9 15 3-3 3 3" animate={{ y: syncStatus === 'syncing' ? [-2, 2, -2] : 0 }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
              </motion.svg>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-[var(--t1)]">{t('Cloud Sync')}</div>
              </div>
              <div className="text-[10px] text-[var(--t3)] font-medium leading-relaxed">
                {syncStatus === 'syncing' ? t('Syncing...') : (settings.lastSync || lastSynced) ? <span className="flex items-center gap-1 opacity-60"><Check size={12} className="w-3 h-3" /> {settings.lastSync || lastSynced}</span> : t('Never synced')}
              </div>
              {syncStatus === 'error' && (
                <div className="text-[10px] text-[var(--danger)] mt-2 font-bold bg-[var(--danger)]/10 p-2 rounded-lg">
                  Error: {syncErrorMsg}
                  {syncErrorMsg.includes('42P10') && (
                    <div className="mt-1 font-normal">
                      Fix: Run <code>ALTER TABLE work_entries ADD UNIQUE (date);</code> in Supabase SQL Editor.
                    </div>
                  )}
                  {syncErrorMsg.includes('row-level security') && (
                    <div className="mt-1 font-normal">
                      Fix: Ensure RLS is configured correctly to allow your device to access its data.
                    </div>
                  )}
                  {syncErrorMsg.includes('does not exist') && (
                    <div className="mt-1 font-normal">
                      Fix: Create the table first: <code>CREATE TABLE work_entries (date TEXT UNIQUE, hours NUMERIC, month TEXT);</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={syncTapActual.trigger}
            disabled={syncStatus === 'syncing'}
            className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl text-white font-bold text-xs active:scale-95 transition-all disabled:opacity-50 relative overflow-hidden ${
              syncStatus === 'success' ? 'bg-[var(--green)]' : 
              syncStatus === 'error' ? 'bg-[var(--danger)]' : 
              'bg-[var(--a)]'
            }`}
          >
            {syncStatus === 'syncing' ? (
              <><RefreshCw size={14} className="animate-spin" /> {t('Syncing...')}</>
            ) : syncTapActual.isConfirming ? (
              <div className="flex items-center gap-2">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]"
                />
                {t('Tap to Sync')}
              </div>
            ) : syncStatus === 'success' ? (
              <><Check size={14} /> {t('Synchronized')}</>
            ) : syncStatus === 'error' ? (
              <><AlertTriangle size={14} /> {t('Sync Failed')}</>
            ) : (
              <><RefreshCw size={14} /> {t('Sync')}</>
            )}
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--bg-1)] border border-[var(--b)] space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--a-bg)] flex items-center justify-center text-[var(--a)]"><Database size={18} /></div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-[var(--t1)]">{t('Data & Backup')}</div>
              <div className="text-[10px] text-[var(--t3)] font-medium leading-relaxed">{t('Export your records safely')}</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <button onClick={exportCSV} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg)] transition-colors border border-transparent hover:border-[var(--b)]">
              <div className="flex items-center gap-3"><FileText size={16} className="text-[var(--t2)]"/> <span className="text-xs font-bold text-[var(--t1)]">{t('Export CSV')}</span></div>
              <ChevronRight size={14} className="text-[var(--t3)]"/>
            </button>
            <button onClick={exportTXT} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg)] transition-colors border border-transparent hover:border-[var(--b)]">
              <div className="flex items-center gap-3"><FileText size={16} className="text-[var(--t2)]"/> <span className="text-xs font-bold text-[var(--t1)]">{t('Save .txt')}</span></div>
              <ChevronRight size={14} className="text-[var(--t3)]"/>
            </button>
            <button 
              onClick={() => exportPDF('year')} 
              disabled={isExporting}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg)] transition-colors border border-transparent hover:border-[var(--b)] disabled:opacity-50"
            >
              <div className="flex items-center gap-3"><FileText size={16} className="text-[var(--t2)]"/> <span className="text-xs font-bold text-[var(--t1)]">{t('PDF Report')}</span></div>
              <ChevronRight size={14} className="text-[var(--t3)]"/>
            </button>
            <button onClick={shareBackup} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg)] transition-colors border border-transparent hover:border-[var(--b)]">
              <div className="flex items-center gap-3"><Download size={16} className="text-[var(--t2)]"/> <span className="text-xs font-bold text-[var(--t1)]">{t('Backup Data')}</span></div>
              <ChevronRight size={14} className="text-[var(--t3)]"/>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pt-4 pb-8 gap-2">
          <button onClick={deleteAllTap.trigger} className="flex items-center gap-2 px-5 py-2.5 rounded-full hover:bg-[var(--danger-bg)] transition-all border border-[var(--danger)]/20 text-[var(--danger)] active:scale-95">
            <Trash size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">{deleteAllTap.isConfirming ? t('Tap again to delete all') : t('Delete All Data')}</span>
          </button>
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--t3)] opacity-40">Version V1.022</div>
        </div>
      </div>
    </div>
  );
}
