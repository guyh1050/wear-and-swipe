// ============================================================
// SwipeView.js — מסך הסווייפ (גלה)
// ------------------------------------------------------------
// אחראי על הצגת ערימת הכרטיסים, קליטת פעולות המשתמש
// (לייק/דילוג/מועדף/חזרה), ושידור אירועים ל-EventBus.
// ============================================================

import { bus } from '../core/EventBus.js';

export class SwipeView {
  constructor(state) {
    this.state = state;       // המצב המשותף (queue, currentIndex, likes...)
    this.deck = document.getElementById('deck');
    this._bindControls();
  }

  _bindControls() {
    document.getElementById('btn-like').onclick = () => this._swipe('like');
    document.getElementById('btn-pass').onclick = () => this._swipe('pass');
    document.getElementById('btn-super').onclick = () => this._swipe('super');
    document.getElementById('btn-undo').onclick = () => bus.emit('undo');
    document.getElementById('btn-info').onclick = () => {
      const item = this._topItem();
      if (item) bus.emit('show-info', item.id);
    };
  }

  _topItem() {
    return this.state.queue[this.state.currentIndex] || null;
  }

  _swipe(action) {
    const item = this._topItem();
    if (!item) return;
    bus.emit('swipe', { item, action });
  }

  /** רינדור ערימת הכרטיסים (עד 3 קדימה) */
  render() {
    const { queue, currentIndex } = this.state;
    const items = queue.slice(currentIndex, currentIndex + 3).reverse();
    if (items.length === 0) {
      this.deck.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--ink-dim)">סיימת לעבור על הפריטים — חזור מאוחר יותר לעוד!</div>';
      this._updateButtons();
      return;
    }
    this.deck.innerHTML = items.map((item, i) => {
      const depth = items.length - 1 - i;
      const scale = 1 - depth * 0.04;
      const translateY = depth * 10;
      return `
        <div class="card" data-id="${item.id}" style="transform:scale(${scale}) translateY(${translateY}px);z-index:${i}">
          <img class="card-img" src="${this._img(item)}" alt="${item.name}"
               onerror="this.style.background='var(--bg-2)';this.removeAttribute('src')">
          <div class="card-info">
            <div class="card-brand">${item.brand}</div>
            <div class="card-name">${item.name}</div>
            <div class="card-price">${item.price}</div>
          </div>
        </div>`;
    }).join('');
    this._updateButtons();
  }

  _img(item) {
    return item.img || (item.images && item.images[0]) || '';
  }

  _updateButtons() {
    const has = !!this._topItem();
    ['btn-like', 'btn-pass', 'btn-super', 'btn-info'].forEach((id) => {
      document.getElementById(id).disabled = !has;
    });
    document.getElementById('btn-undo').disabled = this.state.history.length === 0;
  }
}

export default SwipeView;
