// ============================================================
// OutfitView.js — מסך השילובים (אווטפיטים)
// ------------------------------------------------------------
// מציג את האווטפיטים שנבנו ע"י OutfitBuilder, כולל תצוגת
// "בובת ראווה" שבה הפריטים ממוקמים לפי מיקום אנטומי.
// ============================================================

import { bus } from '../core/EventBus.js';

const SLOT_OF = {
  tee: 'torso', top: 'torso', shirt: 'torso', sweater: 'torso',
  pants: 'legs', shorts: 'legs', skirt: 'legs',
  dress: 'torso', outerwear: 'outer', shoes: 'feet', accessory: 'acc',
};

export class OutfitView {
  constructor(state, outfitBuilder) {
    this.state = state;
    this.builder = outfitBuilder;
    this.el = document.getElementById('view-outfits');
  }

  render() {
    const totalLikes = this.state.likes.length + this.state.favorites.length;
    if (totalLikes < 2) {
      this.el.innerHTML = `<div class="empty-msg" style="padding:60px 24px">
        עשה/י לפחות 2 לייקים מקטגוריות שונות כדי לבנות שילובים.</div>`;
      return;
    }
    const outfits = this.builder.build(this.state.likes, this.state.favorites, this.state.userVector);
    this.state.outfits = outfits;

    if (outfits.length === 0) {
      this.el.innerHTML = `<div class="empty-msg" style="padding:60px 24px">
        צריך פריטים ממגוון קטגוריות (עליון + תחתון) כדי לבנות לוק.</div>`;
      return;
    }

    this.el.innerHTML = `
      <div class="outfits-header">
        <h2>שילובים מומלצים</h2>
        <p>${outfits.length} לוקים מותאמים אישית — לפי הטעם שלך, צבעים וסגנון.</p>
        <button class="filter-bar-btn" id="surprise-btn" style="margin-top:14px;max-width:260px">דמה אקראי — אווטפיט הפתעה</button>
      </div>
      ${outfits.map((o, i) => this._outfitCard(o, i)).join('')}
    `;
    this._bind();
  }

  _outfitCard(outfit, idx) {
    return `
      <div class="outfit-card">
        <div class="outfit-title">לוק ${idx + 1}</div>
        <div class="outfit-score">התאמה: ${Math.round(outfit.score * 100)}%</div>
        ${this.renderMannequin(outfit)}
        <div class="outfit-pieces" style="margin-top:14px">
          ${outfit.pieces.map((p) => `
            <div class="outfit-piece" data-id="${p.id}">
              <img src="${p.img || ''}" onerror="this.style.background='var(--bg-2)';this.removeAttribute('src')">
              <div class="outfit-piece-label">${p.price}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /** תצוגת בובת ראווה — פריטים ממוקמים אנטומית */
  renderMannequin(outfit) {
    const bySlot = {};
    outfit.pieces.forEach((p) => { bySlot[SLOT_OF[p.category] || 'acc'] = p; });
    const img = (p) => p ? `<img src="${p.img || ''}" onerror="this.style.background='var(--bg-2)';this.removeAttribute('src')">` : '';
    return `
      <div class="mannequin">
        <svg class="mannequin-body" viewBox="0 0 200 460" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="40" r="26" fill="var(--line)"/>
          <rect x="90" y="62" width="20" height="18" fill="var(--line)"/>
          <path d="M60 80 L140 80 L150 150 L138 250 L62 250 L50 150 Z" fill="var(--line)" opacity="0.55"/>
          <path d="M60 84 L38 180 L52 184 L72 100 Z" fill="var(--line)" opacity="0.45"/>
          <path d="M140 84 L162 180 L148 184 L128 100 Z" fill="var(--line)" opacity="0.45"/>
          <rect x="64" y="250" width="32" height="150" rx="10" fill="var(--line)" opacity="0.5"/>
          <rect x="104" y="250" width="32" height="150" rx="10" fill="var(--line)" opacity="0.5"/>
        </svg>
        ${bySlot.outer ? `<div class="mq-item mq-outer">${img(bySlot.outer)}</div>` : ''}
        ${bySlot.torso ? `<div class="mq-item mq-torso">${img(bySlot.torso)}</div>` : ''}
        ${bySlot.legs ? `<div class="mq-item mq-legs">${img(bySlot.legs)}</div>` : ''}
        ${bySlot.feet ? `<div class="mq-item mq-feet">${img(bySlot.feet)}</div>` : ''}
        ${bySlot.acc ? `<div class="mq-item mq-acc">${img(bySlot.acc)}</div>` : ''}
      </div>`;
  }

  _bind() {
    const sb = document.getElementById('surprise-btn');
    if (sb) sb.onclick = () => bus.emit('surprise');
    this.el.querySelectorAll('.outfit-piece').forEach((el) => {
      el.onclick = () => bus.emit('show-info', parseInt(el.dataset.id));
    });
  }
}

export default OutfitView;
