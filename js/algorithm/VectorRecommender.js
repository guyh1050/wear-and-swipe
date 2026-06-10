// ============================================================
// VectorRecommender.js — אלגוריתם המלצות מבוסס וקטורים
// ------------------------------------------------------------
// יורש מ-Recommender. מחשב את ההתאמה בין וקטור הטעם של המשתמש
// לבין כל פריט בקטלוג בעזרת דמיון קוסינוס.
// אחראי גם על בניית וקטור הטעם מתוך הפריטים שהמשתמש אהב
// (סופר-לייק שוקל פי 3).
// ============================================================

import { Recommender } from './Recommender.js';
import { Vector } from '../core/Vector.js';

const SUPER_LIKE_WEIGHT = 3; // משקל סופר-לייק לעומת לייק רגיל

export class VectorRecommender extends Recommender {
  constructor(catalog = []) {
    super(catalog);
    this._byId = new Map(catalog.map((it) => [it.id, it]));
  }

  /** מימוש score() — דמיון קוסינוס בין הפריט לוקטור הטעם */
  score(item, userVector) {
    if (!userVector || userVector.magnitude() === 0) return 0;
    return this.itemVector(item).cosineSimilarity(userVector);
  }

  /**
   * בניית וקטור הטעם של המשתמש מתוך הלייקים והמועדפים.
   * @param {number[]} likedIds - מזהי פריטים שאהב
   * @param {number[]} favoriteIds - מזהי מועדפים (סופר-לייק, שוקלים יותר)
   * @returns {Vector}
   */
  buildUserVector(likedIds = [], favoriteIds = []) {
    const vectors = [];
    const weights = [];
    const favSet = new Set(favoriteIds);

    for (const id of likedIds) {
      const item = this._byId.get(id);
      if (!item) continue;
      vectors.push(new Vector(item.vec || []));
      weights.push(favSet.has(id) ? SUPER_LIKE_WEIGHT : 1);
    }
    // מועדפים שלא היו ברשימת הלייקים
    for (const id of favoriteIds) {
      if (likedIds.includes(id)) continue;
      const item = this._byId.get(id);
      if (!item) continue;
      vectors.push(new Vector(item.vec || []));
      weights.push(SUPER_LIKE_WEIGHT);
    }

    if (vectors.length === 0) return new Vector([]);
    return Vector.weightedAverage(vectors, weights);
  }
}

export default VectorRecommender;
