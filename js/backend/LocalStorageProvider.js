// ============================================================
// LocalStorageProvider.js — אחסון מקומי בדפדפן
// ------------------------------------------------------------
// יורש מ-StorageProvider ומממש אחסון מעל localStorage.
// כל משתמש מקבל מרחב-שמות (namespace) משלו, כך שנתוני
// משתמשים שונים מופרדים. משמש כגיבוי כאשר Firebase לא זמין.
// ============================================================

import { StorageProvider } from './StorageProvider.js';

export class LocalStorageProvider extends StorageProvider {
  constructor() {
    super(); // קריאה לבנאי מחלקת-האב
    this.prefix = 'wns:';
    this.globalKeys = ['catalog', 'catalog_version'];
  }

  /** בניית המפתח המלא לפי המשתמש הפעיל */
  _fullKey(key) {
    if (this.globalKeys.includes(key)) return this.prefix + 'global:' + key;
    const user = this.currentUser || '_guest';
    return this.prefix + 'user:' + user + ':' + key;
  }

  async get(key) {
    try {
      const raw = localStorage.getItem(this._fullKey(key));
      return raw === null ? null : JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  async set(key, value) {
    try {
      localStorage.setItem(this._fullKey(key), JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage set failed', e);
    }
  }

  async delete(key) {
    try {
      localStorage.removeItem(this._fullKey(key));
    } catch (e) {}
  }

  isAvailable() {
    try {
      const t = '__wns_test__';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default LocalStorageProvider;
