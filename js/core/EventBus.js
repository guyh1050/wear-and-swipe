// ============================================================
// EventBus.js — אפיק אירועים מרכזי
// ------------------------------------------------------------
// מאפשר למודולים שונים לתקשר בלי להכיר זה את זה ישירות
// (Decoupling). מודול אחד "משדר" אירוע, ואחרים "מאזינים" לו.
// לדוגמה: כשמשתמש עושה לייק, ה-UI משדר 'swipe' וה-Recommender מגיב.
// ============================================================

export class EventBus {
  constructor() {
    this.listeners = {};
  }

  /** הרשמה לאירוע */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback); // מחזיר פונקציית ביטול
  }

  /** ביטול הרשמה */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  /** שידור אירוע לכל המאזינים */
  emit(event, data) {
    if (!this.listeners[event]) return;
    for (const cb of this.listeners[event]) {
      try {
        cb(data);
      } catch (e) {
        console.error(`EventBus error in '${event}':`, e);
      }
    }
  }
}

// מופע יחיד (Singleton) משותף לכל המערכת
export const bus = new EventBus();
export default bus;
