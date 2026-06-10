// ============================================================
// FirebaseStorage.js — אחסון בענן (Cloud Firestore)
// ------------------------------------------------------------
// יורש מ-StorageProvider ומממש אחסון בענן של Google.
// כל משתמש נשמר כמסמך נפרד באוסף 'users', לפי ה-UID שלו.
// כך הנתונים מסונכרנים בין מכשירים ומאובטחים ע"י Security Rules.
// ============================================================

import { StorageProvider } from './StorageProvider.js';

export class FirebaseStorage extends StorageProvider {
  /**
   * @param {object} db - מופע Firestore (firebase.firestore())
   * @param {function} getUid - פונקציה שמחזירה את ה-UID של המשתמש המחובר
   */
  constructor(db, getUid) {
    super();
    this.db = db;
    this.getUid = getUid;
  }

  /** הפניה למסמך המשתמש הנוכחי ב-Firestore */
  _userDoc() {
    const uid = this.getUid();
    if (!uid) return null;
    return this.db.collection('users').doc(uid);
  }

  async get(key) {
    const doc = this._userDoc();
    if (!doc) return null;
    try {
      const snap = await doc.get();
      if (!snap.exists) return null;
      const data = snap.data();
      return data && key in data ? data[key] : null;
    } catch (e) {
      console.error('Firestore get failed', e);
      return null;
    }
  }

  async set(key, value) {
    const doc = this._userDoc();
    if (!doc) return;
    try {
      // merge:true כדי לעדכן שדה בודד בלי לדרוס את שאר המסמך
      await doc.set({ [key]: value }, { merge: true });
    } catch (e) {
      console.error('Firestore set failed', e);
    }
  }

  async delete(key) {
    const doc = this._userDoc();
    if (!doc) return;
    try {
      // מחיקת שדה בודד
      const FieldValue = window.firebase.firestore.FieldValue;
      await doc.update({ [key]: FieldValue.delete() });
    } catch (e) {}
  }

  isAvailable() {
    return !!this.db && !!this.getUid();
  }
}

export default FirebaseStorage;
