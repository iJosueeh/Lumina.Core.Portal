/**
 * Shared evaluation display utilities.
 * Pure functions — no Angular DI, no state. Used by:
 *  - EvaluationsComponent (page)
 *  - EvaluationsWidgetComponent (dashboard widget)
 */

export type EvaluationStatus = 'urgent' | 'upcoming' | 'available' | 'completed';
export type EvaluationDifficulty = 'easy' | 'medium' | 'hard';

/** Returns { text, badgeClasses } for a status pill. */
export function getStatusBadge(status: EvaluationStatus): { text: string; class: string } {
  switch (status) {
    case 'urgent':
      return { text: 'En riesgo', class: 'bg-rose-50 text-rose-700 border border-rose-200' };
    case 'upcoming':
      return { text: 'En curso', class: 'bg-amber-50 text-amber-700 border border-amber-200' };
    case 'completed':
      return { text: 'Aprobado', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    default:
      return { text: 'Disponible', class: 'bg-cyan-50 text-cyan-700 border border-cyan-200' };
  }
}

/** Returns Tailwind classes for a difficulty pill. */
export function getDifficultyClasses(difficulty: EvaluationDifficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'hard':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-200';
  }
}

/** Returns the difficulty label in Spanish. */
export function getDifficultyLabel(difficulty: EvaluationDifficulty): string {
  switch (difficulty) {
    case 'easy': return 'Fácil';
    case 'medium': return 'Media';
    case 'hard': return 'Alta';
    default: return difficulty;
  }
}

/**
 * Returns Tailwind text-color class for a vigesimal score (0–20).
 * Scale: ≥17 Excelente, ≥14 Bueno, ≥10.5 Aprobado, <10.5 Desaprobado.
 */
export function getScoreColorClass(score: number | undefined): string {
  if (!score) return 'text-slate-400';
  if (score >= 17) return 'text-emerald-600';
  if (score >= 14) return 'text-blue-600';
  if (score >= 10.5) return 'text-amber-600';
  return 'text-red-600';
}

/** Returns text + Tailwind classes for widget status display. */
export function getStatusColorClasses(status: EvaluationStatus): string {
  switch (status) {
    case 'urgent': return 'text-red-600 bg-red-50';
    case 'upcoming': return 'text-amber-600 bg-amber-50';
    case 'available': return 'text-emerald-600 bg-emerald-50';
    case 'completed': return 'text-blue-600 bg-blue-50';
    default: return 'text-slate-500 bg-slate-50';
  }
}

/** Normalizes a score that might be in percentage (0–100) to vigesimal (0–20). */
export function normalizeToVigesimal(score: number | undefined): number {
  if (!score) return 0;
  return score > 20 ? (score / 100) * 20 : score;
}

/** Computes the percentage of `used` over `allowed` (0–100). */
export function getProgressPercentage(used: number, allowed: number): number {
  if (allowed === 0) return 0;
  return Math.min((used / allowed) * 100, 100);
}
