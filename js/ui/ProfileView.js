// ============================================================
// ProfileView.js — מסך הפרופיל
// ------------------------------------------------------------
// מציג סטטיסטיקות, גלריית מועדפים (עם הסרה), וויזואליזציה
// של וקטור הטעם שנלמד.
// ============================================================

import { bus } from '../core/EventBus.js';

export class ProfileView {
  constructor(state, catalog) {
    this.state = state;
    this.byId = new Map(catalog.map((it) => [it.id, it]));
    this.el = document.getElementById('view-profile');
  }

  render() {
    const s = this.state;
    const seen = s.likes.length + s.passes.length;
    const initial = (s.username || '?').charAt(0).toUpperCase();

    this.el.innerHTML = `
      <div class="profile">
        <div class="profile-head">
          <div class="avatar">${initial}</div>
          <h2>${s.username || 'משתמש'}</h2>
        </div>
        <div class="stats-grid">
          <div class="stat-cell"><div class="num">${s.likes.length}</div><div class="label">לייקים</div></div>
          <div class="stat-cell"><div class="num">${s.favorites.length}</div><div class="label">מועדפים</div></div>
          <div class="stat-cell"><div class="num">${s.passes.length}</div><div class="label">דילוג</div></div>
          <div class="stat-cell"><div class="num">${seen}</div><div class="label">כל מה שראית</div></div>
        </div>

        <div class="section-h">המועדפים שלי (★)</div>
        <div class="favorites-gallery" id="fav-gallery">${this._favorites()}</div>

        <div class="section-h">וקטור הטעם שלך</div>
        <div class="vector-viz">${this._vectorBars()}</div>

        <div style="margin-top:28px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="filter-bar-btn" id="logout-btn">התנתקות</button>
        </div>
      </div>`;
    this._bind();
  }

  _favorites() {
    const favs = this.state.favorites.map((id) => this.byId.get(id)).filter(Boolean);
    if (favs.length === 0) {
      return '<div class="empty-msg">עדיין אין מועדפים. עשה/י סופר-לייק (★) לפריט.</div>';
    }
    return favs.map((item) => `
      <div class="fav-card" data-id="${item.id}">
        <button class="fav-remove" data-remove="${item.id}">✕</button>
        <img src="${item.img || ''}" onerror="this.style.background='var(--bg-2)';this.removeAttribute('src')">
      </div>`).join('');
  }

  _vectorBars() {
    const v = this.state.userVector ? this.state.userVector.toArray() : [];
    if (v.length === 0) return '<div class="empty-msg">טרם נלמד טעם — עשה כמה לייקים.</div>';
    const max = Math.max(...v.map(Math.abs), 0.001);
    return v.map((val) => `<div class="vec-bar" style="height:${Math.abs(val) / max * 100}%"></div>`).join('');
  }

  _bind() {
    this.el.querySelectorAll('.fav-card').forEach((el) => {
      el.onclick = (e) => {
        if (e.target.dataset.remove) {
          bus.emit('remove-favorite', parseInt(e.target.dataset.remove));
        } else {
          bus.emit('show-info', parseInt(el.dataset.id));
        }
      };
    });
    const lo = document.getElementById('logout-btn');
    if (lo) lo.onclick = () => bus.emit('logout');
  }
}

export default ProfileView;
