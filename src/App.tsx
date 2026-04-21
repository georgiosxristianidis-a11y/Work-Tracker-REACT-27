/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { 
  Calendar, 
  Settings, 
  Plus, 
  Minus, 
  Save, 
  Trash, 
  Download, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  TrendingUp,
  Clock,
  FileText,
  AlertTriangle,
  Check,
  Database,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { db, Entry } from './lib/db';
import { Logo } from './components/Logo';
import { HomeScreen } from './components/HomeScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { MONTH_NAMES, MONTH_NAMES_RUS, MONTH_NAMES_GR, DOW_NAMES, AppSettings } from './constants';

const AnalyticsChart = lazy(() => import('./components/AnalyticsChart'));

// --- Utilities ---
const haptic = (pattern: number | number[] = 30, enabled = true) => {
  if (enabled && typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const getDeviceId = () => {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('device_id', id);
  }
  return id;
};

// --- Hooks ---
function useDoubleTap(action: () => void, timeout = 3000) {
  const [isConfirming, setIsConfirming] = useState(false);
  useEffect(() => {
    let t: any;
    if (isConfirming) t = setTimeout(() => setIsConfirming(false), timeout);
    return () => clearTimeout(t);
  }, [isConfirming, timeout]);
  return {
    isConfirming,
    trigger: () => {
      if (isConfirming) {
        setIsConfirming(false);
        action();
      } else {
        setIsConfirming(true);
      }
    }
  };
}

// --- Main App Component ---
export default function App() {
  const [screen, setScreen] = useState<'home' | 'calendar' | 'chart' | 'total' | 'settings'>('home');
  const [chartPeriod, setChartPeriod] = useState<6 | 12>(6);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [yearEntries, setYearEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currency: 'EUR',
    language: 'ENG',
    rate: 15,
    overtime: 1.5,
    normal: 10,
    goal: 2700,
    bonus: 0,
    deduction: 0,
    privacyMode: false,
    e2eeEnabled: false,
    e2eeKey: '',
    theme: 'light',
    hapticEnabled: true
  });
  const [viewDate, setViewDate] = useState(new Date());
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLangOverride, setAiLangOverride] = useState<'ENG' | 'RUS' | 'GR' | null>(null);
  const [cachedInsights, setCachedInsights] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const [editorDate, setEditorDate] = useState<string | null>(null);
  const [editorHours, setEditorHours] = useState(10);
  const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);
  const [showCustomFill, setShowCustomFill] = useState(false);
  const [customFill, setCustomFill] = useState({ work: 5, off: 2, hours: 8 });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncErrorMsg, setSyncErrorMsg] = useState<string>('');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('6/1-10');
  const [excludeSundays, setExcludeSundays] = useState(true);
  const [navClicks, setNavClicks] = useState({ home: 0, calendar: 0, chart: 0, settings: 0 });
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const curSym = settings.currency === 'RUB' ? '₽' : '€';
  
  const h = (pattern: number | number[] = 30) => haptic(pattern, settings.hapticEnabled);

  const t = (key: string) => {
    if (settings.language === 'ENG') return key;
    
    const dictRUS: Record<string, string> = {
      'Home': 'Главная',
      'Calendar': 'Календарь',
      'Chart': 'График',
      'Total': 'Итого',
      'Settings': 'Настройки',
      'Save': 'Сохранить',
      'Salary Edit': 'Редактирование ЗП',
      'Hourly Rate': 'Ставка в час',
      'Goal': 'Цель',
      'Cloud Sync': 'Синхронизация',
      'Privacy & Security': 'Приватность',
      'Custom Settings': 'Доп. Настройки',
      'Appearance': 'Внешний вид',
      'Data & Backup Management': 'Управление данными',
      'E2E Encryption & Blurring': 'Шифрование и скрытие',
      'Syncing...': 'Синхронизация...',
      'Never synced': 'Нет синхронизации',
      'Sync': 'Синхронизировать',
      'Synchronized': 'Синхронизировано',
      'Sync Failed': 'Ошибка синхронизации',
      'Export CSV': 'Экспорт CSV',
      'Clear Data': 'Очистить данные',
      'Quick Fill': 'Быстрое заполнение',
      'Custom': 'Свой',
      'Apply': 'Применить',
      'Tap to Apply': 'Нажмите для применения',
      'Clear': 'Очистить',
      'Tap to Clear': 'Нажмите для очистки',
      'Total Hours': 'Всего часов',
      'Total Earned': 'Всего заработано',
      'Overtime': 'Переработка',
      'Normal': 'Обычные',
      'Days Worked': 'Отработанные дни',
      'Average/Day': 'В среднем/день',
      'Projected': 'Прогноз',
      'Goal Progress': 'Прогресс цели',
      'No data for this month': 'Нет данных за этот месяц',
      'Add entries in the Calendar tab': 'Добавьте записи во вкладке Календарь',
      'Language': 'Язык',
      'Currency': 'Валюта',
      'Haptic Feedback': 'Виброотклик',
      'ON': 'ВКЛ',
      'OFF': 'ВЫКЛ',
      'Recent Entries': 'Последние записи',
      'View All': 'Все',
      'Save .txt': 'Сохранить .txt',
      'PDF Report': 'PDF Отчет',
      'Backup Data': 'Бэкап данных',
      'Delete All Data': 'Удалить все данные',
      'Tap again to delete all': 'Нажмите еще раз для удаления',
      'Days': 'Дни',
      'Hours': 'Часы',
      'Skip Sundays': 'Без воскресений',
      'Tap to Sync': 'Нажмите для синхрона',
      'Analytics': 'Аналитика',
      'of Goal': 'от цели',
      'Trend': 'Тренд',
      'Earned': 'Заработано',
      'Monthly Earnings': 'Месячный доход',
      'Privacy Mode (Blur)': 'Режим инкогнито (размытие)',
      'Goal:': 'Цель:',
    };

    const dictGR: Record<string, string> = {
      'Home': 'Αρχική',
      'Calendar': 'Ημερολόγιο',
      'Chart': 'Γράφημα',
      'Total': 'Σύνολο',
      'Settings': 'Ρυθμίσεις',
      'Save': 'Αποθήκευση',
      'Salary Edit': 'Επεξεργασία Μισθού',
      'Hourly Rate': 'Ωρομίσθιο',
      'Goal': 'Στόχος',
      'Cloud Sync': 'Συγχρονισμός',
      'Privacy & Security': 'Απόρρητο & Ασφάλεια',
      'Custom Settings': 'Προσαρμοσμένες Ρυθμίσεις',
      'Appearance': 'Εμφάνιση',
      'Data & Backup Management': 'Διαχείριση Δεδομένων',
      'E2E Encryption & Blurring': 'Κρυπτογράφηση & Θόλωμα',
      'Syncing...': 'Συγχρονισμός...',
      'Never synced': 'Ποτέ δεν συγχρονίστηκε',
      'Sync': 'Συγχρονισμός',
      'Synchronized': 'Συγχρονίστηκε',
      'Sync Failed': 'Αποτυχία Συγχρονισμού',
      'Export CSV': 'Εξαγωγή CSV',
      'Clear Data': 'Εκκαθάριση Δεδομένων',
      'Quick Fill': 'Γρήγορη Συμπλήρωση',
      'Custom': 'Προσαρμοσμένο',
      'Apply': 'Εφαρμογή',
      'Tap to Apply': 'Πατήστε για Εφαρμογή',
      'Clear': 'Εκκαθάριση',
      'Tap to Clear': 'Πατήστε για Εκκαθάριση',
      'Total Hours': 'Συνολικές Ώρες',
      'Total Earned': 'Συνολικά Κέρδη',
      'Overtime': 'Υπερωρίες',
      'Normal': 'Κανονικά',
      'Days Worked': 'Ημέρες Εργασίας',
      'Average/Day': 'Μέσος όρος/Ημέρα',
      'Projected': 'Προβλεπόμενα',
      'Goal Progress': 'Πρόοδος Στόχου',
      'No data for this month': 'Δεν υπάρχουν δεδομένα',
      'Add entries in the Calendar tab': 'Προσθέστε εγγραφές στο Ημερολόγιο',
      'Language': 'Γλώσσα',
      'Currency': 'Νόμισμα',
      'Haptic Feedback': 'Απτική Ανάδραση',
      'ON': 'ΝΑΙ',
      'OFF': 'ΟΧΙ',
      'Recent Entries': 'Πρόσφατες Εγγραφές',
      'View All': 'Όλα',
      'Save .txt': 'Αποθήκευση .txt',
      'PDF Report': 'Αναφορά PDF',
      'Backup Data': 'Αντίγραφο Ασφαλείας',
      'Delete All Data': 'Διαγραφή Όλων',
      'Tap again to delete all': 'Πατήστε ξανά για διαγραφή',
      'Days': 'Ημέρες',
      'Hours': 'Ώρες',
      'Skip Sundays': 'Χωρίς Κυριακές',
      'Tap to Sync': 'Πατήστε για Συγχρονισμό',
      'Analytics': 'Αναλυτικά',
      'of Goal': 'του Στόχου',
      'Trend': 'Τάση',
      'Earned': 'Κέρδη',
      'Monthly Earnings': 'Μηνιαία Κέρδη',
      'Privacy Mode (Blur)': 'Λειτουργία Απορρήτου (Θόλωμα)',
      'Goal:': 'Στόχος:',
    };

    if (settings.language === 'RUS') return dictRUS[key] || key;
    if (settings.language === 'GR') return dictGR[key] || key;
    return key;
  };

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      await db.init();
      
      // Migrate from old version
      const migratedCount = await migrateFromLocalStorage();
      if (migratedCount > 0) {
        addToast(`Migrated ${migratedCount} entries`, 'success');
      }

      const savedSettings = await db.getSetting('settings', settings);
      const mergedSettings = { ...settings };
      if (savedSettings) {
        Object.keys(savedSettings).forEach(key => {
          if (savedSettings[key] !== undefined) {
            (mergedSettings as any)[key] = savedSettings[key];
          }
        });
      }
      setSettings(mergedSettings);
      
      // Apply theme
      document.documentElement.className = mergedSettings.theme || 'light';
      
      await loadEntries();
      setIsAuthReady(true);
      
      // Artificial delay for splash screen
      setTimeout(() => setIsLoading(false), 1200);
    };
    init();
  }, []);

  const migrateFromLocalStorage = async () => {
    const done = await db.getSetting('ls_migrated', false);
    if (done) return 0;

    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
        const hours = parseFloat(localStorage.getItem(key) || '0');
        if (hours > 0) {
          await db.saveEntry({ date: key, hours, month: key.slice(0, 7) });
          count++;
        }
      }
    }
    await db.setSetting('ls_migrated', true);
    return count;
  };

  const loadEntries = async (theme?: string) => {
    const month = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    const data = await db.getEntriesByMonth(month);
    setEntries(data);
  };

  const loadYearEntries = async () => {
    const data = await db.getAllEntries();
    setYearEntries(data);
  };

  useEffect(() => {
    if (isAuthReady) loadEntries();
  }, [viewDate, isAuthReady]);

  useEffect(() => {
    if (isAuthReady && (screen === 'total' || screen === 'chart')) loadYearEntries();
  }, [screen, isAuthReady]);

  // --- Helpers ---
  const addToast = (msg: string, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000);
  };

  const calcEarnings = (hours: number) => {
    const rate = settings.rate || 0;
    const overtime = settings.overtime || 0;
    const normal = settings.normal || 0;
    if (hours <= normal) return hours * rate;
    return normal * rate + (hours - normal) * rate * overtime;
  };

  const totalEarned = useMemo(() => {
    const base = entries.reduce((s, e) => s + calcEarnings(e.hours), 0);
    return base + (settings.bonus || 0) - (settings.deduction || 0);
  }, [entries, settings]);

  const totalHours = useMemo(() => entries.reduce((s, e) => s + e.hours, 0), [entries]);
  const goalPct = settings.goal > 0 ? Math.min(100, Math.max(0, Math.round(((totalEarned || 0) / settings.goal) * 100))) : 0;

  const chartData = useMemo(() => {
    const months = [];
    const count = chartPeriod - 1;
    for (let i = count; i >= 0; i--) {
      const d = new Date(viewDate.getFullYear(), viewDate.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        month: MONTH_NAMES[d.getMonth()].slice(0, 3),
        fullMonth: mStr,
        earnings: 0,
        goal: settings.goal || 0
      });
    }
    
    yearEntries.forEach(e => {
      const m = months.find(m => m.fullMonth === e.date.slice(0, 7));
      if (m) {
        m.earnings += calcEarnings(e.hours) || 0;
      }
    });
    
    return months;
  }, [yearEntries, viewDate, settings.goal, settings.rate, settings.overtime, settings.normal, chartPeriod]);

  // --- Actions ---
  const saveEntry = async (date: string, hours: number) => {
    haptic(20);
    const entry = { date, hours, month: date.slice(0, 7) };
    await db.saveEntry(entry);
    await loadEntries();
    addToast('Entry saved', 'success');
    
    // Background sync
    if (navigator.onLine) {
      syncWithSupabaseAction();
    }
  };

  const deleteEntry = async (date: string) => {
    haptic([30, 50]);
    await db.deleteEntry(date);
    await loadEntries();
    addToast('Entry deleted', 'warning');
    
    if (navigator.onLine) {
      syncWithSupabaseAction();
    }
  };

  const applyQuickFill = async (workDays: number, offDays: number, hours: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cycleLength = workDays + offDays;
    
    let workDayCounter = 0;
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dow = new Date(year, month, i).getDay(); // 0 is Sunday
      
      if (excludeSundays && dow === 0) {
        await db.deleteEntry(dateStr);
        continue;
      }
      
      let isWorkDay = false;
      if (cycleLength === 7 && (workDays === 5 || workDays === 6)) {
        if (workDays === 5) isWorkDay = dow >= 1 && dow <= 5;
        if (workDays === 6) isWorkDay = dow !== 0;
      } else {
        isWorkDay = (workDayCounter % cycleLength) < workDays;
        workDayCounter++;
      }
      
      if (isWorkDay) {
        await db.saveEntry({ date: dateStr, hours, month: dateStr.slice(0, 7) });
      } else {
        await db.deleteEntry(dateStr);
      }
    }
    
    await loadEntries();
    addToast('Schedule applied', 'success');
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate === 'custom') {
      applyQuickFill(customFill.work, customFill.off, customFill.hours);
    } else {
      const [days, hours] = selectedTemplate.split('-');
      const [work, off] = days.split('/');
      applyQuickFill(parseInt(work), parseInt(off), parseInt(hours));
    }
  };

  const getDefaultHours = () => {
    if (selectedTemplate === 'custom') return customFill.hours || 8;
    const parts = selectedTemplate.split('-');
    return parts.length === 2 ? parseInt(parts[1]) || 8 : 8;
  };

  const clearMonth = async () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      await db.deleteEntry(dateStr);
    }
    await loadEntries();
    addToast('Month cleared', 'warning');
  };

  const applyTap = useDoubleTap(handleApplyTemplate);
  const clearTap = useDoubleTap(clearMonth);

  const syncWithSupabaseAction = async () => {
    if (!supabase) {
      addToast('Supabase credentials missing in .env', 'error');
      return;
    }
    setSyncStatus('syncing');
    try {
      const allEntries = await db.getAllEntries();
      const device_id = getDeviceId();
      
      const payload = allEntries.map(e => {
        return { ...e, device_id };
      });
      
      // Upsert to 'work_entries' table
      const { error } = await supabase
        .from('work_entries')
        .upsert(payload, { onConflict: 'date' });

      if (error) throw error;

      setSyncStatus('success');
      setSyncErrorMsg('');
      const now = new Date().toLocaleString(settings.language === 'ENG' ? 'en-US' : settings.language === 'RUS' ? 'ru-RU' : 'el-GR', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setLastSynced(now);
      setSettings(s => {
        const newSettings = { ...s, lastSync: now };
        db.setSetting('settings', newSettings);
        return newSettings;
      });
      addToast('Synced with Supabase', 'success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (err: any) {
      console.error('Sync error:', err);
      setSyncStatus('error');
      const errorMsg = err?.message || 'Sync failed';
      setSyncErrorMsg(errorMsg);
      addToast(errorMsg.length > 40 ? errorMsg.substring(0, 40) + '...' : errorMsg, 'error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const syncTapActual = useDoubleTap(syncWithSupabaseAction);

  const exportCSV = async () => {
    const allEntries = await db.getAllEntries();
    const rows = [['Date', 'Hours', 'Earned']];
    allEntries.forEach(e => rows.push([e.date, e.hours.toString(), calcEarnings(e.hours).toFixed(2)]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'work-tracker.csv'; a.click();
    addToast('CSV Exported', 'success');
  };

  const exportTXT = async () => {
    const allEntries = await db.getAllEntries();
    
    let totalH = 0;
    let totalE = 0;
    allEntries.forEach(e => {
      totalH += e.hours;
      totalE += calcEarnings(e.hours);
    });

    const mNames = settings.language === 'RUS' ? MONTH_NAMES_RUS : settings.language === 'GR' ? MONTH_NAMES_GR : MONTH_NAMES;
    const currentMonthName = mNames[viewDate.getMonth()];

    let txt = `╔══════════════════════════════════════╗\n`;
    txt += `║        WORK TRACKER — REPORT         ║\n`;
    txt += `╚══════════════════════════════════════╝\n\n`;
    txt += `👤 USER:    Professional\n`;
    txt += `💰 Rate:    ${curSym}${settings.rate}/h\n`;
    txt += `📈 Overtime: ${curSym}${settings.overtime}/h\n`;
    txt += `⚡ PERIOD:  ${currentMonthName} ${viewDate.getFullYear()}\n\n`;
    txt += `────────── PERFORMANCE ──────────\n`;
    txt += `⏱️  Total Hours:  ${totalH}h\n`;
    txt += `💶  Total Earned: ${curSym}${totalE.toFixed(2)}\n\n`;

    allEntries.sort((a,b) => b.date.localeCompare(a.date)).forEach(e => {
      txt += `──────────────────────────────────────\n`;
      txt += `📅 Date:    ${e.date}\n`;
      txt += `💪 Status:  Work Day\n`;
      txt += `⚡ Hours:   ${e.hours}h\n`;
      txt += `💶 Earned:  ${curSym}${calcEarnings(e.hours).toFixed(2)}\n`;
    });
    
    txt += `\n══════════════════════════════════════\n`;
    txt += `Создано Work Tracker Pro\n`;

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'work-tracker-report.txt'; a.click();
    addToast('TXT Exported', 'success');
  };

  const shareBackup = async () => {
    const allEntries = await db.getAllEntries();
    const data = { entries: allEntries, settings };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'work-tracker-backup.json'; a.click();
    addToast('Backup Downloaded', 'success');
  };

  const clearAllData = async () => {
    await db.clearAll();
    setEntries([]);
    addToast('All data deleted', 'warning');
  };

  const deleteAllTap = useDoubleTap(clearAllData);
  const deleteEntryTap = useDoubleTap(async () => {
    if (editorDate) {
      await deleteEntry(editorDate);
      setEditorDate(null);
    }
  });

  const toggleTheme = async () => {
    const themes: ('light' | 'dark' | 'indigo')[] = ['light', 'dark', 'indigo'];
    const nextTheme = themes[(themes.indexOf(settings.theme) + 1) % themes.length];
    const newSettings = { ...settings, theme: nextTheme };
    setSettings(newSettings);
    document.documentElement.className = nextTheme;
    await db.setSetting('settings', newSettings);
  };

  const generateAiInsight = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      const allEntries = await db.getAllEntries();
      const history = allEntries.slice(0, 100).map(e => `${e.date}: ${e.hours}h`).join(', ');
      
      const langMap: Record<string, string> = { ENG: 'English', RUS: 'Russian', GR: 'Greek' };
      const currentLang = aiLangOverride || settings.language;
      const targetLang = langMap[currentLang] || 'English';

      // Advanced caching based on history hash and language
      const cacheKey = `${history}-${targetLang}`;
      if (cachedInsights[cacheKey]) {
        setAiInsight(cachedInsights[cacheKey]);
        setIsAiLoading(false);
        return;
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are an AI assistant in a personal working hours tracker app. Analyze this work history and provide 3 short, analytical tips about work-life balance, overtime trends, or schedule consistency. 
CRITICAL RULES:
1. This is for a regular employee/worker. Do NOT mention clients, contracts, freelancing, raising rates, or finding new work.
2. Focus ONLY on health, schedule consistency, hours tracked, and resting patterns.
3. Respond strictly in ${targetLang}. 
4. Be extremely concise, no fluff, just 3 specific actionable points.
5. ABSOLUTELY NO EMOJIS. Use strict, corporate typographic symbols for list items (e.g., "▪" or "—").
6. Do NOT use any markdown formatting like bolding or stars.
History: ${history}`,
      });
      
      const insight = response.text || "No insights available yet.";
      setAiInsight(insight);
      
      // Update cache
      setCachedInsights(prev => ({...prev, [cacheKey]: insight}));
      
    } catch (e) {
      addToast('AI Insight failed', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const exportPDF = async (period: '6months' | 'year') => {
    if (isExporting) return;
    setIsExporting(true);
    haptic(30);
    addToast('Loading PDF engine...', 'info');

    try {
      // Dynamic import for heavy libraries
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = (autoTableModule.default || autoTableModule) as any;

      addToast('Generating PDF Report...', 'info');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const now = new Date();
      const { rate, overtime, normal, goal } = settings;

      const allEntries = await db.getAllEntries();
      let months: { month: number; year: number }[] = [];

      if (period === '6months') {
        for (let i = 5; i >= 0; i--) {
          let mo = viewDate.getMonth() - i, yr = viewDate.getFullYear();
          while (mo < 0) { mo += 12; yr--; }
          months.push({ month: mo, year: yr });
        }
      } else {
        for (let mo = 0; mo < 12; mo++) months.push({ month: mo, year: viewDate.getFullYear() });
      }

      const stats = months.map(({ month, year }) => {
        const ms = `${year}-${String(month + 1).padStart(2, '0')}`;
        const entries = allEntries.filter(e => e.date.startsWith(ms));
        const hours = entries.reduce((s, e) => s + e.hours, 0);
        const earned = entries.reduce((s, e) => s + calcEarnings(e.hours), 0);
        const otHours = entries.reduce((s, e) => s + Math.max(0, e.hours - normal), 0);
        const days = entries.length;
        const pct = goal > 0 ? Math.round((earned / goal) * 100) : 0;
        
        const mNames = settings.language === 'RUS' ? MONTH_NAMES_RUS : settings.language === 'GR' ? MONTH_NAMES_GR : MONTH_NAMES;
        return { label: `${mNames[month].slice(0, 3)} ${year}`, month, year, hours, earned, otHours, days, pct, entries };
      });

      const totalEarned = stats.reduce((s, m) => s + m.earned, 0);
      const totalHours = stats.reduce((s, m) => s + m.hours, 0);
      const totalDays = stats.reduce((s, m) => s + m.days, 0);

      // Colors (Elite Midnight Gold)
      const C = {
        bg: [13, 15, 20],
        card: [20, 20, 24],
        gold: [200, 181, 96],
        text1: [240, 236, 224],
        text2: [138, 128, 112],
        b: [40, 40, 45]
      };

      const W = 210, H = 297;
      
      // Page 1: Summary
      doc.setFillColor(C.bg[0], C.bg[1], C.bg[2]);
      doc.rect(0, 0, W, H, 'F');

      doc.setFillColor(C.card[0], C.card[1], C.card[2]);
      doc.rect(0, 0, W, 25, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(C.gold[0], C.gold[1], C.gold[2]);
      doc.text('WORK TRACKER PRO', 15, 16);

      const periodLabel = period === '6months' ? '6-MONTH PERFORMANCE REPORT' : `ANNUAL REPORT ${viewDate.getFullYear()}`;
      doc.setFontSize(8);
      doc.setTextColor(C.text2[0], C.text2[1], C.text2[2]);
      doc.text(periodLabel, W - 15, 16, { align: 'right' });

      // Summary Card
      let y = 35;
      doc.setFillColor(C.card[0], C.card[1], C.card[2]);
      doc.roundedRect(15, y, W - 30, 40, 4, 4, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(C.gold[0], C.gold[1], C.gold[2]);
      doc.text('TOTAL EARNINGS', 22, y + 12);
      
      doc.setFontSize(32);
      doc.setTextColor(C.text1[0], C.text1[1], C.text1[2]);
      doc.text(`${curSym}${totalEarned.toLocaleString()}`, 22, y + 28);

      const miniStats = [
        { l: 'Days', v: totalDays },
        { l: 'Hours', v: `${totalHours}h` },
        { l: 'Goal', v: `${Math.round((totalEarned / (goal * stats.length || 1)) * 100)}%` }
      ];
      
      miniStats.forEach((s, i) => {
        const sx = W - 25 - (2 - i) * 25;
        doc.setFontSize(14);
        doc.setTextColor(C.text1[0], C.text1[1], C.text1[2]);
        doc.text(String(s.v), sx, y + 22, { align: 'center' });
        doc.setFontSize(7);
        doc.setTextColor(C.text2[0], C.text2[1], C.text2[2]);
        doc.text(s.l, sx, y + 30, { align: 'center' });
      });

      y += 55;
      
      // Monthly Breakdown Table
      autoTable(doc, {
        startY: y,
        head: [['Month', 'Days', 'Hours', 'OT', 'Earned', 'Goal %']],
        body: stats.map(s => [s.label, s.days, `${s.hours}h`, `${s.otHours}h`, `${curSym}${s.earned.toFixed(0)}`, `${s.pct}%`]),
        theme: 'plain',
        styles: { fillColor: C.card, textColor: C.text1, fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: C.bg, textColor: C.gold, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [25, 25, 30] },
        margin: { left: 15, right: 15 }
      });

      // Page 2: Daily Log (if entries exist)
      if (totalDays > 0) {
        doc.addPage();
        doc.setFillColor(C.bg[0], C.bg[1], C.bg[2]);
        doc.rect(0, 0, W, H, 'F');
        
        doc.setFillColor(C.card[0], C.card[1], C.card[2]);
        doc.rect(0, 0, W, 20, 'F');
        
        doc.setFontSize(10);
        doc.setTextColor(C.gold[0], C.gold[1], C.gold[2]);
        doc.text('DAILY WORK LOG', 15, 13);
        
        const dayRows: any[] = [];
        stats.forEach(s => {
          s.entries.sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
            const isOT = e.hours > normal;
            dayRows.push([
              e.date,
              e.hours + 'h',
              isOT ? (e.hours - normal).toFixed(1) + 'h' : '-',
              curSym + calcEarnings(e.hours).toFixed(2)
            ]);
          });
        });

        autoTable(doc, {
          startY: 25,
          head: [['Date', 'Hours', 'Overtime', 'Earned']],
          body: dayRows,
          theme: 'plain',
          styles: { fillColor: C.card, textColor: C.text1, fontSize: 7, cellPadding: 3 },
          headStyles: { fillColor: C.bg, textColor: C.gold, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [25, 25, 30] },
          margin: { left: 15, right: 15 }
        });
      }

      doc.save(`work-report-${period}-${now.toISOString().split('T')[0]}.pdf`);
      addToast('PDF Exported Successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('PDF Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const renderTotal = () => {
    const year = viewDate.getFullYear();
    const currentYearEntries = yearEntries.filter(e => e.date.startsWith(String(year)));
    const yearTotal = currentYearEntries.reduce((s, e) => s + calcEarnings(e.hours), 0);
    const yearHours = currentYearEntries.reduce((s, e) => s + e.hours, 0);
    
    const months = Array.from(new Set(currentYearEntries.map(e => e.date.slice(0, 7)))).sort().reverse();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight text-[var(--t1)]">Annual Total</h1>
          <div className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-widest">{year}</div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-[2.5rem] bg-[var(--bg-1)] border border-[var(--b)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--a)]" />
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--t3)]">Total Earned this Year</span>
            <div className="text-5xl font-light tracking-tighter text-[var(--t1)]">
              <span className="text-2xl text-[var(--t3)] mr-1">{curSym}</span>
              {yearTotal.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-[var(--t2)] pt-2">{months.length} active months · {yearHours} total hours</div>
          </div>
        </motion.div>

        <div className="space-y-3">
          {months.map((ms: any) => {
            const mEntries = currentYearEntries.filter(e => e.date.startsWith(ms));
            const mHours = mEntries.reduce((s, e) => s + e.hours, 0);
            const mEarned = mEntries.reduce((s, e) => s + calcEarnings(e.hours), 0);
            const mIndex = parseInt(ms.split('-')[1]) - 1;
            
            return (
              <div key={ms} className="flex items-center gap-4 p-5 rounded-3xl border border-[var(--b)] bg-[var(--bg-1)]">
                <div className="w-12 h-12 rounded-2xl bg-[var(--a-bg)] flex flex-col items-center justify-center text-[var(--a)] border border-[var(--a-b)]">
                  <span className="text-[10px] font-black uppercase leading-none">{getMonthName(new Date(parseInt(ms.split('-')[0]), mIndex)).slice(0, 3)}</span>
                  <span className="text-[8px] font-bold opacity-60">{ms.split('-')[0].slice(2)}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--t1)]">{mEntries.length} days · {mHours}h</div>
                  <div className="text-[10px] text-[var(--t3)] font-medium">{getMonthName(new Date(parseInt(ms.split('-')[0]), mIndex))}</div>
                </div>
                <div className="text-lg font-black text-[var(--t1)]">{curSym}{mEarned.toFixed(0)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getMonthName = (date: Date) => {
    const m = date.getMonth();
    if (settings.language === 'RUS') return MONTH_NAMES_RUS[m];
    if (settings.language === 'GR') return MONTH_NAMES_GR[m];
    return MONTH_NAMES[m];
  };

  // --- Renderers ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111] font-['Epilogue']">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-[var(--bg)] flex flex-col items-center justify-center gap-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: 1 
              }}
              transition={{ 
                scale: {
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                },
                opacity: {
                  type: "spring", stiffness: 200, damping: 20
                }
              }}
            >
              <Logo className="w-20 h-20 text-[var(--t1)]" />
            </motion.div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--t1)]">Work Tracker Pro</span>
              <div className="w-32 h-0.5 bg-[var(--b)] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-full h-full bg-[var(--a)]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="frame" className="relative w-full max-w-[393px] h-[100dvh] sm:h-[min(100vh,852px)] bg-[var(--bg)] overflow-hidden flex flex-col shadow-2xl sm:rounded-[52px] sm:border-[11px] sm:border-[#1c1c1e]">
        {/* Status Bar / Top Bar */}
        <div className="h-14 px-6 flex items-center justify-between shrink-0 z-50 bg-[var(--bg)] border-b border-[var(--b)]">
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {screen !== 'home' && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => { haptic(15); setScreen('home'); }}
                  className="p-1 -ml-2 text-[var(--t1)] hover:bg-[var(--a-bg)] rounded-full transition-colors"
                >
                  <ChevronLeft size={22} />
                </motion.button>
              )}
            </AnimatePresence>
            <button 
              onClick={() => { haptic(15); setScreen('home'); }}
              className="flex items-center gap-2.5 group"
            >
              <motion.div 
                whileTap={{ scale: 0.85, y: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative w-7 h-7 flex items-center justify-center text-[var(--t1)]"
              >
                <Logo className="w-full h-full" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black tracking-[0.2em] text-[var(--t1)] uppercase leading-none">
                  Work Tracker Pro
                </span>
                <span className="text-[8px] font-bold text-[var(--t3)] uppercase tracking-widest mt-0.5">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </span>
              </div>
            </button>
          </div>
          
          <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold lowercase transition-all duration-500 ${navigator.onLine ? 'bg-[var(--t1)] text-[var(--bg)]' : 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)]/20'}`}>
            {syncStatus === 'syncing' ? (
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
            ) : (!navigator.onLine || syncStatus === 'error') ? (
              <motion.div 
                animate={{ opacity: [0.2, 1, 0.2] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" 
              />
            ) : (
              <motion.div 
                animate={{ opacity: [0.2, 1, 0.2] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" 
              />
            )}
            <span>{navigator.onLine ? 'online' : 'offline'}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {screen === 'home' && (
                <HomeScreen
                  viewDate={viewDate}
                  setViewDate={setViewDate}
                  getMonthName={getMonthName}
                  totalEarned={totalEarned}
                  goalPct={goalPct}
                  totalHours={totalHours}
                  entries={entries}
                  settings={settings}
                  setSettings={setSettings}
                  setScreen={setScreen}
                  setEditorDate={setEditorDate}
                  setEditorHours={setEditorHours}
                  calcEarnings={calcEarnings}
                  t={t}
                  curSym={curSym}
                />
              )}
              {screen === 'calendar' && (
                <CalendarScreen
                  viewDate={viewDate}
                  setViewDate={setViewDate}
                  entries={entries}
                  settings={settings}
                  t={t}
                  editorDate={editorDate}
                  setEditorDate={setEditorDate}
                  editorHours={editorHours}
                  setEditorHours={setEditorHours}
                  defaultEditorHours={getDefaultHours()}
                  saveEntry={() => { if (editorDate) saveEntry(editorDate, editorHours); }}
                  clearTap={deleteEntryTap}
                  clearMonthTap={clearTap}
                  haptic={h}
                  openQuickFill={() => {
                    haptic(10);
                    setIsQuickFillOpen(true);
                  }}
                />
              )}
              {screen === 'chart' && (
                <AnalyticsScreen
                  t={t}
                  aiLangOverride={aiLangOverride}
                  setAiLangOverride={setAiLangOverride}
                  settings={settings}
                  haptic={h}
                  generateAiInsight={generateAiInsight}
                  isAiLoading={isAiLoading}
                  aiInsight={aiInsight}
                  setAiInsight={setAiInsight}
                  goalPct={goalPct}
                  entries={entries}
                  totalHours={totalHours}
                  curSym={curSym}
                  chartPeriod={chartPeriod}
                  setChartPeriod={setChartPeriod}
                  chartData={chartData}
                />
              )}
              {screen === 'settings' && (
                <SettingsScreen
                  settings={settings}
                  setSettings={setSettings}
                  t={t}
                  curSym={curSym}
                  haptic={h}
                  syncStatus={syncStatus}
                  syncErrorMsg={syncErrorMsg}
                  lastSynced={lastSynced}
                  syncTapActual={syncTapActual}
                  deleteAllTap={deleteAllTap}
                  toggleTheme={toggleTheme}
                  exportCSV={exportCSV}
                  exportTXT={exportTXT}
                  exportPDF={exportPDF}
                  shareBackup={shareBackup}
                  isExporting={isExporting}
                  addToast={addToast}
                />
              )}
              {screen === 'total' && renderTotal()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 h-20 bg-[var(--bg)] sm:rounded-b-[41px] flex items-center px-2 z-50 border-t border-[var(--b)] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          {[
            { 
              id: 'home', 
              label: t('Home'),
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              )
            },
            { 
              id: 'calendar', 
              label: t('Calendar'),
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              )
            },
            { 
              id: 'chart', 
              label: t('Chart'),
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              )
            },
            { 
              id: 'settings', 
              label: t('Settings'),
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              )
            }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => {
                setScreen(item.id as any);
                setNavClicks(c => ({ ...c, [item.id]: c[item.id as keyof typeof c] + 1 }));
              }}
              className="flex-1 h-full flex flex-col items-center justify-center relative z-10"
            >
              {screen === item.id && (
                <motion.div 
                  layoutId="nav-pill" 
                  className="absolute w-12 h-12 bg-[var(--a-bg)] rounded-2xl -z-10" 
                  transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }} 
                />
              )}
              <motion.div 
                className={`transition-colors duration-300 ${screen === item.id ? 'text-[var(--a)]' : 'text-[var(--t3)] hover:text-[var(--t2)]'}`}
                animate={{ scale: screen === item.id ? 1.05 : 1, y: screen === item.id ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                {item.icon}
              </motion.div>
            </button>
          ))}
        </nav>

        {/* Quick Fill Sheet */}
        <AnimatePresence>
          {isQuickFillOpen && (
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 z-[100] bg-[var(--bg)] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 pb-2">
                <h2 className="text-2xl font-black">{t('Quick Fill')}</h2>
                <button 
                  onClick={() => setIsQuickFillOpen(false)}
                  className="w-10 h-10 rounded-full bg-[var(--bg-1)] border border-[var(--b)] flex items-center justify-center text-[var(--t2)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24 space-y-6">
                {/* Templates */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {['2/2-11', '5/2-8', '6/1-10', '4/4-12'].map((tmpl) => (
                      <button
                        key={tmpl}
                        onClick={() => {
                          h(10);
                          setSelectedTemplate(tmpl);
                          setShowCustomFill(false);
                        }}
                        className={`p-4 rounded-3xl border transition-all ${
                          selectedTemplate === tmpl && !showCustomFill
                            ? 'bg-[var(--a-bg)] border-[var(--a-b)] text-[var(--a)]'
                            : 'bg-[var(--bg-1)] border-[var(--b)] text-[var(--t2)]'
                        }`}
                      >
                        <div className="font-bold">{tmpl.split('-')[0]}</div>
                        <div className="text-[10px] opacity-70">{tmpl.split('-')[1]}h {t('Days')}</div>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        h(10);
                        setSelectedTemplate('custom');
                        setShowCustomFill(true);
                      }}
                      className={`p-4 rounded-3xl border transition-all ${
                        showCustomFill
                          ? 'bg-[var(--a-bg)] border-[var(--a-b)] text-[var(--a)]'
                          : 'bg-[var(--bg-1)] border-[var(--b)] text-[var(--t2)]'
                      }`}
                    >
                      <div className="font-bold">{t('Custom')}</div>
                      <div className="text-[10px] opacity-70">⚙️</div>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showCustomFill && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 p-5 rounded-3xl bg-[var(--bg-1)] border border-[var(--b)]">
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-[var(--t3)]">Work Days</label>
                          <div className="flex gap-2">
                            {[2,3,4,5,6].map(n => (
                              <button
                                key={`w${n}`}
                                onClick={() => setCustomFill(c => ({...c, work: n}))}
                                className={`flex-1 aspect-square rounded-xl border flex items-center justify-center font-bold text-sm ${customFill.work === n ? 'border-[var(--t1)] text-[var(--t1)]' : 'border-[var(--b)] text-[var(--t3)]'}`}
                              >{n}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-[var(--t3)]">Off Days</label>
                          <div className="flex gap-2">
                            {[1,2,3,4].map(n => (
                              <button
                                key={`o${n}`}
                                onClick={() => setCustomFill(c => ({...c, off: n}))}
                                className={`flex-1 aspect-square rounded-xl border flex items-center justify-center font-bold text-sm ${customFill.off === n ? 'border-[var(--t1)] text-[var(--t1)]' : 'border-[var(--b)] text-[var(--t3)]'}`}
                              >{n}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-[var(--t3)]">Hours</label>
                          <div className="flex gap-2">
                            {[8,10,11,12].map(n => (
                              <button
                                key={`h${n}`}
                                onClick={() => setCustomFill(c => ({...c, hours: n}))}
                                className={`flex-1 aspect-square rounded-xl border flex items-center justify-center font-bold text-sm ${customFill.hours === n ? 'border-[var(--t1)] text-[var(--t1)]' : 'border-[var(--b)] text-[var(--t3)]'}`}
                              >{n}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => {
                    h(10);
                    setExcludeSundays(!excludeSundays);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 active:scale-[0.98] ${
                    excludeSundays 
                      ? 'bg-[var(--a-bg)] border-[var(--a-b)]' 
                      : 'bg-[var(--bg-1)] border-[var(--b)]'
                  }`}
                >
                  <span className={`text-[11px] font-black uppercase tracking-widest pt-[1px] transition-colors ${
                    excludeSundays ? 'text-[var(--a)]' : 'text-[var(--t2)]'
                  }`}>
                    {t('Skip Sundays')}
                  </span>
                  
                  <div className={`relative flex items-center w-[44px] h-[24px] p-[2px] rounded-full transition-colors duration-300 border-2 ${
                    excludeSundays ? 'bg-[var(--a)] border-[var(--a)]' : 'bg-transparent border-[var(--t3)]'
                  }`}>
                    <motion.div 
                      layout
                      className={`w-[16px] h-[16px] rounded-full shadow-sm ${excludeSundays ? 'bg-[var(--bg)]' : 'bg-[var(--t3)]'}`}
                      initial={false}
                      animate={{ 
                        x: excludeSundays ? 20 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </button>

                <div className="pt-4 grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      if (applyTap.isConfirming) {
                        applyTap.trigger();
                        setIsQuickFillOpen(false);
                      } else {
                        applyTap.trigger();
                      }
                    }}
                    className="h-14 rounded-2xl bg-[var(--t1)] text-[var(--bg)] font-black text-sm uppercase tracking-widest active:scale-95 transition-transform group flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50 group-active:opacity-100 transition-opacity" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    {applyTap.isConfirming ? t('Tap to Apply') : t('Apply')}
                  </button>
                  <button 
                    onClick={() => {
                      if (clearTap.isConfirming) {
                        clearTap.trigger();
                        setIsQuickFillOpen(false);
                      } else {
                        clearTap.trigger();
                      }
                    }}
                    className="h-14 rounded-2xl bg-[var(--bg-1)] border border-[var(--danger-bg)] text-[var(--danger)] font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <Trash size={16} />
                    {clearTap.isConfirming ? t('Tap to Clear') : t('Clear')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Sheet */}
        <AnimatePresence>
          {editorDate && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end"
              onClick={() => setEditorDate(null)}
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 1 }}
                onDragEnd={(e, { offset, velocity }) => {
                  if (offset.y > 50 || velocity.y > 200) {
                    setEditorDate(null);
                  }
                }}
                className="w-full bg-[var(--bg)] rounded-t-[2.5rem] p-8 space-y-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-12 h-1.5 bg-[var(--b)] rounded-full mx-auto" />
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-[var(--t1)] tracking-tight">
                    {(() => {
                      const [y, m, d] = editorDate.split('-');
                      return `${d} - ${m} - ${y}`;
                    })()}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--t3)]">Log Work Hours</p>
                </div>
                
                <div className="p-6 mt-6 rounded-3xl bg-[var(--bg-1)] border border-[var(--b)] flex flex-col items-center gap-3">
                  <div className="flex items-center justify-between w-full">
                    <button onClick={() => setEditorHours(h => Math.max(0, h - 0.5))} className="w-14 h-14 rounded-2xl bg-[var(--t1)] text-[var(--bg)] flex items-center justify-center active:scale-90 transition-all"><Minus size={24} /></button>
                    <div className="text-5xl font-black text-[var(--t1)] tracking-tighter flex items-baseline translate-y-1">
                      {editorHours}<span className="text-lg text-[var(--t3)] ml-1">h</span>
                    </div>
                    <button onClick={() => setEditorHours(h => Math.min(24, h + 0.5))} className="w-14 h-14 rounded-2xl bg-[var(--t1)] text-[var(--bg)] flex items-center justify-center active:scale-90 transition-all"><Plus size={24} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-bold text-[var(--a)]">{curSym}{calcEarnings(editorHours).toFixed(2)}</div>
                    {editorHours > settings.normal && (
                      <div className="text-[10px] font-bold bg-[var(--green-bg)] text-[var(--green)] px-2 py-0.5 rounded uppercase">
                        +{editorHours - settings.normal}h OT
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={async () => { await saveEntry(editorDate, editorHours); setEditorDate(null); }} className="h-16 rounded-2xl bg-[var(--t1)] text-[var(--bg)] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={18} /> {t('Save')}</button>
                  <button onClick={deleteEntryTap.trigger} className="h-16 rounded-2xl border border-[var(--danger)]/20 text-[var(--danger)] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"><Trash size={18} /> {deleteEntryTap.isConfirming ? 'Confirm' : 'Delete'}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toasts */}
        <div className="absolute top-12 left-6 right-6 z-[300] space-y-2 pointer-events-none flex flex-col items-center">
          {toasts.map(t => (
            <motion.div 
              key={t.id} 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold pointer-events-auto bg-[var(--bg-1)] border border-[var(--b)] text-[var(--t1)]"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${t.type === 'success' ? 'bg-[var(--a-bg)] text-[var(--a)]' : t.type === 'error' ? 'bg-[var(--danger-bg)] text-[var(--danger)]' : 'bg-[var(--b)] text-[var(--t1)]'}`}>
                {t.type === 'success' ? <Check size={12} strokeWidth={3} /> : t.type === 'error' ? <AlertTriangle size={12} strokeWidth={3} /> : <Sparkles size={12} strokeWidth={3} />}
              </div>
              {t.msg}
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
