// ============================================================
// Vector.js — מחלקת וקטור מתמטי
// ------------------------------------------------------------
// מרכזת את כל הפעולות המתמטיות על וקטורי מאפיינים.
// זהו הבסיס לאלגוריתם ההמלצות: כל פריט וכל משתמש מיוצגים
// כוקטור בן 16 ממדים, וההתאמה ביניהם נמדדת בדמיון קוסינוס.
// ============================================================

export class Vector {
  /**
   * @param {number[]} values - מערך המספרים של הוקטור (16 ממדים)
   */
  constructor(values = []) {
    this.values = Array.isArray(values) ? [...values] : [];
  }

  get length() {
    return this.values.length;
  }

  /** אורך (נורמה) של הוקטור — שורש סכום הריבועים */
  magnitude() {
    let sum = 0;
    for (const v of this.values) sum += v * v;
    return Math.sqrt(sum);
  }

  /** מכפלה סקלרית (Dot Product) בין שני וקטורים */
  dot(other) {
    const n = Math.min(this.values.length, other.values.length);
    let sum = 0;
    for (let i = 0; i < n; i++) sum += this.values[i] * other.values[i];
    return sum;
  }

  /**
   * דמיון קוסינוס — הלב של אלגוריתם ההמלצות.
   * מחזיר ערך בין 0 ל-1: ככל שקרוב ל-1, הוקטורים דומים יותר בכיוון
   * (כלומר הפריטים דומים יותר בסגנון), ללא תלות בעוצמה.
   * נוסחה: cos(θ) = (A · B) / (|A| × |B|)
   */
  cosineSimilarity(other) {
    const magA = this.magnitude();
    const magB = other.magnitude();
    if (magA === 0 || magB === 0) return 0;
    return this.dot(other) / (magA * magB);
  }

  /** חיבור וקטור אחר (מחזיר וקטור חדש) */
  add(other) {
    const n = Math.max(this.values.length, other.values.length);
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push((this.values[i] || 0) + (other.values[i] || 0));
    }
    return new Vector(result);
  }

  /** הכפלה בסקלר (מחזיר וקטור חדש) — משמש לשקלול (סופר-לייק = ×3) */
  scale(factor) {
    return new Vector(this.values.map((v) => v * factor));
  }

  /** ממוצע משוקלל של אוסף וקטורים לפי משקלים */
  static weightedAverage(vectors, weights) {
    if (vectors.length === 0) return new Vector([]);
    const dim = vectors[0].length;
    const result = new Array(dim).fill(0);
    let totalWeight = 0;
    vectors.forEach((vec, i) => {
      const w = weights[i] != null ? weights[i] : 1;
      totalWeight += w;
      for (let d = 0; d < dim; d++) {
        result[d] += (vec.values[d] || 0) * w;
      }
    });
    if (totalWeight === 0) return new Vector(result);
    return new Vector(result.map((v) => v / totalWeight));
  }

  toArray() {
    return [...this.values];
  }
}

export default Vector;
