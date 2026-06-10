// ============================================================
// AuthService.js — שירות אימות משתמשים
// ------------------------------------------------------------
// אחראי על הרשמה, התחברות וניתוק. עובד מול Firebase Authentication
// כאשר זמין, ונופל לאימות מקומי (localStorage) כגיבוי.
// שם המשתמש מומר לכתובת אימייל פנימית (username@wns.app).
// ============================================================

const DOMAIN = '@wns.app';
const ADMIN_USERNAME = 'guy';
const LOCAL_USERS_KEY = 'wns:auth:users';
const SESSION_KEY = 'wns:auth:session';

export class AuthService {
  /**
   * @param {object|null} firebaseAuth - מופע firebase.auth() או null
   */
  constructor(firebaseAuth = null) {
    this.fbAuth = firebaseAuth;
    this.useCloud = !!firebaseAuth;
    this.currentUsername = null;
  }

  _toEmail(username) {
    return username.toLowerCase() + DOMAIN;
  }

  async _hash(password) {
    const data = new TextEncoder().encode(password + ':wns-salt-v1');
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  _loadLocalUsers() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  _saveLocalUsers(users) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }

  /** הרשמה — מחזיר את שם המשתמש */
  async register(username, password) {
    username = (username || '').trim();
    if (username.length < 2) throw new Error('שם המשתמש חייב להכיל לפחות 2 תווים');
    if ((password || '').length < 6) throw new Error('הסיסמה חייבת להכיל לפחות 6 תווים');

    if (this.useCloud) {
      await this.fbAuth.createUserWithEmailAndPassword(this._toEmail(username), password);
      this.currentUsername = username;
      return username;
    }
    // גיבוי מקומי
    const users = this._loadLocalUsers();
    const key = username.toLowerCase();
    if (users[key]) throw new Error('שם המשתמש כבר תפוס — נסה/י להתחבר');
    users[key] = { username, passwordHash: await this._hash(password), createdAt: new Date().toISOString() };
    this._saveLocalUsers(users);
    this.currentUsername = username;
    return username;
  }

  /** התחברות — מחזיר את שם המשתמש */
  async login(username, password) {
    username = (username || '').trim();
    if (this.useCloud) {
      await this.fbAuth.signInWithEmailAndPassword(this._toEmail(username), password);
      this.currentUsername = username;
      return username;
    }
    const users = this._loadLocalUsers();
    const user = users[username.toLowerCase()];
    if (!user) throw new Error('שם המשתמש לא נמצא');
    if ((await this._hash(password)) !== user.passwordHash) throw new Error('סיסמה שגויה');
    this.currentUsername = user.username;
    return user.username;
  }

  async logout() {
    if (this.useCloud) {
      try { await this.fbAuth.signOut(); } catch (e) {}
    }
    this.currentUsername = null;
    localStorage.removeItem(SESSION_KEY);
  }

  /** ה-UID לאחסון: ב-Firebase זה ה-uid האמיתי, מקומית זה שם המשתמש */
  getUid() {
    if (this.useCloud && this.fbAuth.currentUser) return this.fbAuth.currentUser.uid;
    return this.currentUsername;
  }

  getUsername() {
    return this.currentUsername;
  }

  /** האם המשתמש הנוכחי הוא המנהל? */
  isAdmin() {
    return this.currentUsername && this.currentUsername.toLowerCase() === ADMIN_USERNAME;
  }

  setSession(username) {
    localStorage.setItem(SESSION_KEY, username);
  }

  getSession() {
    return localStorage.getItem(SESSION_KEY);
  }
}

export { ADMIN_USERNAME };
export default AuthService;
