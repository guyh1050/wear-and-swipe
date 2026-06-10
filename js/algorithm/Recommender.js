// ============================================================
// Recommender.js — מחלקת בסיס אבסטרקטית לאלגוריתם ההמלצות
// ------------------------------------------------------------
// מחלקת-אב המגדירה את המבנה המשותף לכל אלגוריתם המלצה:
// כל יורשת חייבת לממש score() — חישוב ציון התאמה לפריט.
// היורשות:
//   • VectorRecommender — המלצות פריטים לפי דמיון קוסינוס
//   • OutfitBuilder — בניית שילובי לבוש (אווטפיטים)
// (שימוש בירושה ובפולימורפיזם — אותה מתודה recommend()
//  עובדת לכל יורשת לפי המימוש שלה ל-score()).
// ============================================================

import { Vector } from '../core/Vector.js';

export class Recommender {
  constructor(catalog = []) {
    if (new.target === Recommender) {
      throw new Error('Recommender היא מחלקה אבסטרקטית — יש לרשת ממנה');
    }
    this.catalog = catalog;
  }

  /**
   * מתודה אבסטרקטית — כל יורשת מחשבת ציון התאמה אחרת.
   * @param {object} item - פריט מהקטלוג
   * @param {Vector} userVector - וקטור הטעם של המשתמש
   * @returns {number} ציון בין 0 ל-1
   */
  score(item, userVector) {
    throw new Error('score() must be implemented by subclass');
  }

  /**
   * מתודה משותפת (פולימורפית) — מדרגת את כל הפריטים לפי score().
   * עובדת זהה לכל יורשת, אך משתמשת ב-score() הספציפי שלה.
   */
  recommend(userVector, { exclude = [], limit = 50 } = {}) {
    const excludeSet = new Set(exclude);
    return this.catalog
      .filter((item) => !excludeSet.has(item.id))
      .map((item) => ({ item, score: this.score(item, userVector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /** המרת פריט לוקטור */
  itemVector(item) {
    return new Vector(item.vec || []);
  }
}

export default Recommender;
