// ============================================================
// main.js — נקודת הכניסה הראשית (Controller)
// ------------------------------------------------------------
// מחבר את כל השכבות: backend (אחסון + אימות), algorithm
// (וקטורים + המלצות + אווטפיטים), ו-UI (מסכים).
// מנהל את זרימת האירועים דרך ה-EventBus.
// ============================================================

import { CATALOG } from '../data/catalog.js';
import { bus } from './core/EventBus.js';
import { Vector } from './core/Vector.js';

import { AuthService } from './backend/AuthService.js';
import { FirebaseStorage } from './backend/FirebaseStorage.js';
import { LocalStorageProvider } from './backend/LocalStorageProvider.js';

import { VectorRecommender } from './algorithm/VectorRecommender.js';
import { OutfitBuilder } from './algorithm/OutfitBuilder.js';

import { SwipeView } from './ui/SwipeView.js';
import { OutfitView } from './ui/OutfitView.js';
import { ProfileView } from './ui/ProfileView.js';

// ---- קונפיגורציית Firebase ----
const firebaseConfig = {
  apiKey: 'AIzaSyBROOpM-GyzNSBEKahtFNyz0viSBZIwrOs',
  authDomain: 'swip-and-wear.firebaseapp.com',
  projectId: 'swip-and-wear',
  storageBucket: 'swip-and-wear.firebasestorage.app',
  messagingSenderId: '359168068258',
  appId: '1:359168068258:web:59d837551e1374f25765fb',
};

class App {
  constructor() {
    // --- אתחול שכבת ה-backend ---
    let firebaseAuth = null;
    let db = null;
    try {
      if (window.firebase) {
        window.firebase.initializeApp(firebaseConfig);
        firebaseAuth = window.firebase.auth();
        db = window.firebase.firestore();
      }
    } catch (e) {
      console.warn('Firebase init failed, using local storage', e);
    }

    this.auth = new AuthService(firebaseAuth);
    // בחירת ספק אחסון — Firebase אם זמין, אחרת מקומי (פולימורפיזם!)
    this.storage = db
      ? new FirebaseStorage(db, () => this.auth.getUid())
      : new LocalStorageProvider();

    // --- אתחול שכבת האלגוריתם ---
    this.recommender = new VectorRecommender(CATALOG);
    this.outfitBuilder = new OutfitBuilder(CATALOG);

    // --- מצב משותף ---
    this.state = {
      username: null,
      likes: [], passes: [], favorites: [],
      history: [], queue: [], currentIndex: 0,
      userVector: new Vector([]),
      outfits: [],
    };

    // --- שכבת ה-UI ---
    this.swipeView = new SwipeView(this.state);
    this.outfitView = new OutfitView(this.state, this.outfitBuilder);
    this.profileView = new ProfileView(this.state, CATALOG);

    this._bindEvents();
    this._bindAuthUI();
    this._bindNav();
  }

  // ====== אירועים (דרך EventBus) ======
  _bindEvents() {
    bus.on('swipe', ({ item, action }) => this._handleSwipe(item, action));
    bus.on('undo', () => this._handleUndo());
    bus.on('show-info', (id) => this._showInfo(id));
    bus.on('remove-favorite', (id) => this._removeFavorite(id));
    bus.on('surprise', () => this._showSurprise());
    bus.on('logout', () => this._logout());
  }

  // ====== זרימת סווייפ ======
  _handleSwipe(item, action) {
    if (action === 'like') {
      if (!this.state.likes.includes(item.id)) this.state.likes.push(item.id);
    } else if (action === 'super') {
      if (!this.state.favorites.includes(item.id)) this.state.favorites.push(item.id);
      if (!this.state.likes.includes(item.id)) this.state.likes.push(item.id);
    } else {
      if (!this.state.passes.includes(item.id)) this.state.passes.push(item.id);
    }
    this.state.history.unshift({ id: item.id, action });
    this.state.currentIndex++;

    // עדכון וקטור הטעם (אלגוריתם)
    if (action === 'like' || action === 'super') {
      this.state.userVector = this.recommender.buildUserVector(this.state.likes, this.state.favorites);
    }
    this._save();

    if (this.state.currentIndex >= this.state.queue.length) this._buildQueue();
    this.swipeView.render();
  }

  _handleUndo() {
    if (this.state.history.length === 0) return;
    const last = this.state.history.shift();
    this.state.likes = this.state.likes.filter((id) => id !== last.id);
    this.state.passes = this.state.passes.filter((id) => id !== last.id);
    this.state.favorites = this.state.favorites.filter((id) => id !== last.id);
    if (this.state.currentIndex > 0) this.state.currentIndex--;
    this.state.userVector = this.recommender.buildUserVector(this.state.likes, this.state.favorites);
    this._save();
    this.swipeView.render();
    this._toast('חזרת למוצר הקודם');
  }

  /** בניית תור הסווייפ לפי המלצות האלגוריתם */
  _buildQueue() {
    const seen = [...this.state.likes, ...this.state.passes];
    if (this.state.userVector.magnitude() > 0) {
      // יש טעם — נמליץ לפי דמיון קוסינוס
      const recs = this.recommender.recommend(this.state.userVector, { exclude: seen, limit: 60 });
      this.state.queue = recs.map((r) => r.item);
    } else {
      // אין עדיין טעם — ערבוב אקראי
      this.state.queue = CATALOG.filter((it) => !seen.includes(it.id))
        .sort(() => Math.random() - 0.5).slice(0, 60);
    }
    this.state.currentIndex = 0;
  }

  // ====== מועדפים ======
  _removeFavorite(id) {
    this.state.favorites = this.state.favorites.filter((f) => f !== id);
    this._save();
    this.profileView.render();
    this._toast('הוסר מהמועדפים');
  }

  // ====== דמה אקראי ======
  _showSurprise() {
    const outfits = this.outfitBuilder.build(this.state.likes, this.state.favorites, this.state.userVector);
    if (outfits.length === 0) { this._toast('צריך עוד פריטים מקטגוריות שונות'); return; }
    const top = outfits.slice(0, Math.ceil(outfits.length / 2));
    const pick = top[Math.floor(Math.random() * top.length)];
    const total = pick.pieces.reduce((s, p) => s + (parseFloat((p.price || '').replace(/[^\d.]/g, '')) || 0), 0);
    document.getElementById('info-content').innerHTML = `
      <h3 style="text-align:center;margin-bottom:12px">אווטפיט הפתעה</h3>
      ${this.outfitView.renderMannequin(pick)}
      <div style="text-align:center;margin-top:14px;font-weight:600">סה"כ: ₪${total.toFixed(0)}</div>`;
    document.getElementById('info-modal').classList.add('show');
  }

  // ====== פרטי פריט ======
  _showInfo(id) {
    const item = CATALOG.find((c) => c.id === id);
    if (!item) return;
    const buyUrl = item.url && item.url.trim()
      ? item.url
      : `https://www.google.com/search?q=${encodeURIComponent(item.name + ' ' + item.brand)}&tbm=shop`;
    document.getElementById('info-content').innerHTML = `
      <img src="${item.img || ''}" style="width:100%;border-radius:12px;margin-bottom:14px;background:var(--bg-2)"
           onerror="this.removeAttribute('src')">
      <div style="font-size:12px;color:var(--ink-dim)">${item.brand}</div>
      <h3 style="margin:4px 0">${item.name}</h3>
      <div style="color:var(--accent);font-weight:700;font-size:18px">${item.price}</div>
      <a href="${buyUrl}" target="_blank" rel="noopener"
         style="display:block;margin-top:16px;padding:14px;background:var(--ink);color:var(--bg);border-radius:100px;text-align:center;text-decoration:none;font-weight:500">
         ${item.url ? 'לרכישה ב-' + item.brand : 'חפש לרכישה'} ←</a>`;
    document.getElementById('info-modal').classList.add('show');
  }

  // ====== אימות UI ======
  _bindAuthUI() {
    let mode = 'login';
    const setMode = (m) => {
      mode = m;
      document.getElementById('tab-login').classList.toggle('active', m === 'login');
      document.getElementById('tab-register').classList.toggle('active', m === 'register');
      document.getElementById('confirm-field').classList.toggle('hidden', m !== 'register');
      document.getElementById('auth-submit').textContent = m === 'register' ? 'יצירת חשבון' : 'כניסה';
      document.getElementById('auth-error').textContent = '';
    };
    document.getElementById('tab-login').onclick = () => setMode('login');
    document.getElementById('tab-register').onclick = () => setMode('register');

    document.getElementById('auth-submit').onclick = async () => {
      const u = document.getElementById('auth-username').value.trim();
      const pw = document.getElementById('auth-password').value;
      const err = document.getElementById('auth-error');
      err.textContent = '';
      try {
        let name;
        if (mode === 'register') {
          if (pw !== document.getElementById('auth-confirm').value) throw new Error('הסיסמאות אינן תואמות');
          name = await this.auth.register(u, pw);
        } else {
          name = await this.auth.login(u, pw);
        }
        this.auth.setSession(name);
        this.storage.setCurrentUser(this.auth.getUid());
        await this._startApp(name);
      } catch (e) {
        err.textContent = e.message || 'שגיאה';
      }
    };
  }

  // ====== ניווט בין מסכים ======
  _bindNav() {
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.onclick = () => {
        document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
        const view = tab.dataset.view;
        document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + view));
        if (view === 'outfits') this.outfitView.render();
        if (view === 'profile') this.profileView.render();
        if (view === 'swipe') this.swipeView.render();
      };
    });
    document.getElementById('info-close').onclick = () =>
      document.getElementById('info-modal').classList.remove('show');
    document.getElementById('info-modal').onclick = (e) => {
      if (e.target.id === 'info-modal') document.getElementById('info-modal').classList.remove('show');
    };
  }

  // ====== אחסון ======
  async _save() {
    await this.storage.set('state', {
      likes: this.state.likes, passes: this.state.passes,
      favorites: this.state.favorites, history: this.state.history,
      userVector: this.state.userVector.toArray(),
    });
  }

  async _load() {
    const saved = await this.storage.get('state');
    if (saved) {
      this.state.likes = saved.likes || [];
      this.state.passes = saved.passes || [];
      this.state.favorites = saved.favorites || [];
      this.state.history = saved.history || [];
      this.state.userVector = new Vector(saved.userVector || []);
    }
  }

  // ====== הפעלת האפליקציה אחרי התחברות ======
  async _startApp(username) {
    this.state.username = username;
    await this._load();
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    this._buildQueue();
    this.swipeView.render();
  }

  async _logout() {
    await this.auth.logout();
    location.reload();
  }

  _toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ====== כניסה אוטומטית אם יש session ======
  async init() {
    const session = this.auth.getSession();
    if (session) {
      // ב-Firebase צריך להמתין לאימות; כאן פשטני — נציג מסך כניסה
      // (ההתחברות האמיתית מתבצעת דרך הטופס)
    }
  }
}

// ---- הפעלה ----
const app = new App();
app.init();
window.__app = app; // לנוחות דיבוג
