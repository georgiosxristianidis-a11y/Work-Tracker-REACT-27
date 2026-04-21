/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DOW_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const MONTH_NAMES_RUS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const MONTH_NAMES_GR = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
];

export interface AppSettings {
  currency: 'EUR' | 'RUB';
  language: 'ENG' | 'RUS' | 'GR';
  rate: number;
  overtime: number;
  normal: number;
  goal: number;
  bonus: number;
  deduction: number;
  privacyMode: boolean;
  e2eeEnabled: boolean;
  e2eeKey: string;
  theme: 'light' | 'dark' | 'indigo';
  hapticEnabled: boolean;
  lastSync?: string;
}
