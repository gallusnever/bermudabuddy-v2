// Growing Degree Days utils for Bermuda turf
// Inputs: hourly air temps in Fahrenheit; model base in Celsius (0 or 10)

export type GddModel = 'gdd0' | 'gdd10';

export function hourlyToDailyMeanF(tempsF: number[]): number | null {
  const vals = tempsF.filter((v) => Number.isFinite(v));
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum / vals.length;
}

export function gddForDayFromMeanF(meanF: number, model: GddModel): number {
  const meanC = (meanF - 32) * (5 / 9);
  const base = model === 'gdd10' ? 10 : 0;
  const gddC = Math.max(0, meanC - base);
  // return in Celsius-degree-days (standard), consumer can format
  return gddC;
}

export function gddFromHourly(tempsF: number[], model: GddModel): number | null {
  const meanF = hourlyToDailyMeanF(tempsF);
  if (meanF == null) return null;
  return gddForDayFromMeanF(meanF, model);
}

