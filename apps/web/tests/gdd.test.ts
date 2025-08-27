import { describe, it, expect } from 'vitest';
import { gddFromHourly, hourlyToDailyMeanF, gddForDayFromMeanF } from '../lib/gdd';

describe('GDD utils', () => {
  it('computes mean from hourly temps', () => {
    expect(hourlyToDailyMeanF([68, 70, 72, 74])).toBe(71);
  });

  it('computes GDD0 and GDD10 from mean F', () => {
    const meanF = 68; // 20C mean
    expect(gddForDayFromMeanF(meanF, 'gdd0')).toBeCloseTo(20, 5);
    expect(gddForDayFromMeanF(meanF, 'gdd10')).toBeCloseTo(10, 5);
  });

  it('computes GDD from hourly list', () => {
    const hourly = Array(24).fill(68); // flat 68F -> 20C mean
    expect(gddFromHourly(hourly, 'gdd0')).toBeCloseTo(20, 5);
    expect(gddFromHourly(hourly, 'gdd10')).toBeCloseTo(10, 5);
  });
});

