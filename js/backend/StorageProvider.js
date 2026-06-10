// ============================================================
// StorageProvider.js — מחלקת בסיס אבסטרקטית לשכבת האחסון
// ------------------------------------------------------------
// זוהי מחלקת-אב (Base Class) המגדירה את החוזה (interface) שכל
// ספק אחסון חייב לממש: שמירה, טעינה, מחיקה.
// המחלקות היורשות:
//   • FirebaseStorage — אחסון בענן (Firestore)
//   • LocalStorageProvider — אחסון מקומי בדפדפן
// כך אפשר להחליף את שיטת האחסון בלי לשנות את שאר המערכת.
// (עיקרון Liskov Substitution + הפשטה)
// ============================================================

export class StorageProvider {
  constructor() {
    if (new.target === StorageProvider) {
      throw new Error('StorageProvider היא מחלקה אבסטרקטית — יש לרשת ממנה');
    }
    this.currentUser = null;
  }

  /** קביעת המשתמש הפעיל (לבידוד נתונים בין משתמשים) */
  setCurrentUser(username) {
    this.currentUser = username;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // --- מתודות אבסטרקטיות שכל יורשת חייבת לממש ---

  /** @returns {Promise<any>} */
  async get(key) {
    throw new Error('get() must be implemented by subclass');
  }

  /** @returns {Promise<void>} */
  async set(key, value) {
    throw new Error('set() must be implemented by subclass');
  }

  /** @returns {Promise<void>} */
  async delete(key) {
    throw new Error('delete() must be implemented by subclass');
  }

  /** האם ספק זה זמין כעת? (למשל: Firebase דורש רשת) */
  isAvailable() {
    return false;
  }
}

export default StorageProvider;
