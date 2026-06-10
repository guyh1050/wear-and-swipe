// ============================================================
// OutfitBuilder.js — בניית שילובי לבוש (אווטפיטים)
// ------------------------------------------------------------
// יורש מ-Recommender. בונה אווטפיטים מהפריטים שהמשתמש אהב,
// תוך שילוב משוקלל של שלושה גורמים:
//   40% הרמוניית צבעים · 30% דמיון וקטורי · 30% התאמה לטעם
// מבטיח פריט אחד בלבד מכל משבצת אנטומית (עליון/תחתון/נעליים/...).
// ============================================================

import { Recommender } from './Recommender.js';
import { Vector } from '../core/Vector.js';

// מיפוי קטגוריה → משבצת אנטומית
const SLOT_OF = {
  tee: 'top', top: 'top', shirt: 'top', sweater: 'top',
  pants: 'bottom', shorts: 'bottom', skirt: 'bottom',
  dress: 'dress', outerwear: 'outer', shoes: 'feet', accessory: 'acc',
};

export class OutfitBuilder extends Recommender {
  constructor(catalog = []) {
    super(catalog);
    this._byId = new Map(catalog.map((it) => [it.id, it]));
  }

  /** מימוש score() — התאמת פריט לטעם המשתמש (לבחירת בסיס האווטפיט) */
  score(item, userVector) {
    if (!userVector || userVector.magnitude() === 0) return 0.5;
    return this.itemVector(item).cosineSimilarity(userVector);
  }

  slotOf(category) {
    return SLOT_OF[category] || 'acc';
  }

  /** הרמוניית צבעים פשוטה בין שני פריטים (0..1) */
  colorHarmony(a, b) {
    if (!a.color || !b.color) return 0.6;
    if (a.color === b.color) return 0.7; // אותו צבע — סביר
    return 0.85; // צבעים שונים — בדרך כלל משתלב יפה
  }

  /** ציון משולב לפריט מועמד ביחס לאווטפיט הנבנה */
  _complementScore(candidate, existing, userVector) {
    let colorSum = 0;
    let vecSum = 0;
    existing.forEach((p) => {
      colorSum += this.colorHarmony(candidate, p);
      vecSum += this.itemVector(candidate).cosineSimilarity(this.itemVector(p));
    });
    const colorAvg = existing.length ? colorSum / existing.length : 0.6;
    const vecAvg = existing.length ? vecSum / existing.length : 0.5;
    const taste = this.score(candidate, userVector);
    // 40% צבע · 30% וקטור · 30% טעם
    return 0.4 * colorAvg + 0.3 * vecAvg + 0.3 * taste;
  }

  /** בחירת הפריט המשלים הטוב ביותר מקטגוריה, שלא חוזר על משבצת קיימת */
  _pickComplement(candidates, existing, userVector) {
    const usedSlots = new Set(existing.map((p) => this.slotOf(p.category)));
    const usedIds = new Set(existing.map((p) => p.id));
    const valid = candidates.filter(
      (c) => !usedIds.has(c.id) && !usedSlots.has(this.slotOf(c.category))
    );
    if (valid.length === 0) return null;
    const ranked = valid
      .map((c) => ({ c, s: this._complementScore(c, existing, userVector) }))
      .sort((a, b) => b.s - a.s);
    if (ranked[0].s < 0.5) return null;
    // אקראיות קלה מבין 2 המובילים
    const top = ranked.slice(0, Math.min(2, ranked.length));
    return top[Math.floor(Math.random() * top.length)].c;
  }

  _itemsByCategory(cats, likedIds) {
    const liked = new Set(likedIds);
    return this.catalog.filter((it) => cats.includes(it.category) && liked.has(it.id));
  }

  /**
   * בניית אווטפיטים מהפריטים שאהב המשתמש.
   * @returns {Array<{pieces:object[], categories:string[], score:number}>}
   */
  build(likedIds = [], favoriteIds = [], userVector = new Vector([])) {
    const allLiked = [...new Set([...likedIds, ...favoriteIds])];
    const tops = this._itemsByCategory(['tee', 'top', 'shirt', 'sweater'], allLiked);
    const bottoms = this._itemsByCategory(['pants', 'shorts', 'skirt'], allLiked);
    const shoes = this._itemsByCategory(['shoes'], allLiked);
    const outers = this._itemsByCategory(['outerwear'], allLiked);
    const accessories = this._itemsByCategory(['accessory'], allLiked);

    const outfits = [];

    tops.forEach((top) => {
      bottoms.forEach((bottom) => {
        const pieces = [top, bottom];
        // ז'קט — רק אם העליון אינו סוודר (למניעת שתי שכבות)
        if (top.category !== 'sweater' && outers.length && Math.random() > 0.5) {
          const o = this._pickComplement(outers, pieces, userVector);
          if (o) pieces.push(o);
        }
        if (shoes.length) {
          const s = this._pickComplement(shoes, pieces, userVector);
          if (s) pieces.push(s);
        }
        if (accessories.length) {
          const a = this._pickComplement(accessories, pieces, userVector);
          if (a) pieces.push(a);
        }
        outfits.push(this._finalize(pieces, userVector));
      });
    });

    // הסרת כפילויות משבצת (הגנה אחרונה) + דירוג
    return outfits
      .map((o) => this._dedupeSlots(o))
      .filter((o) => o.pieces.length >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }

  _finalize(pieces, userVector) {
    const score = this._complementScore(pieces[pieces.length - 1], pieces.slice(0, -1), userVector);
    return {
      pieces,
      categories: pieces.map((p) => this.slotOf(p.category)),
      score: Math.max(0, Math.min(1, score)),
    };
  }

  /** מוודא פריט אחד בלבד מכל משבצת אנטומית */
  _dedupeSlots(outfit) {
    const seen = new Set();
    const pieces = [];
    for (const p of outfit.pieces) {
      const slot = this.slotOf(p.category);
      if (seen.has(slot)) continue;
      seen.add(slot);
      pieces.push(p);
    }
    return { ...outfit, pieces, categories: pieces.map((p) => this.slotOf(p.category)) };
  }
}

export default OutfitBuilder;
