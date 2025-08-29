import { describe, it, expect } from 'vitest';
import { gaugeZone } from '../components/pgr-gauge';

describe('PgrGauge zones', () => {
  it('calm under 80%', () => {
    expect(gaugeZone(0)).toBe('calm');
    expect(gaugeZone(79.9)).toBe('calm');
    expect(gaugeZone(80)).toBe('calm'); // <= 80 is calm
  });
  it('amber 80-100%', () => {
    expect(gaugeZone(80.1)).toBe('amber');
    expect(gaugeZone(90)).toBe('amber');
    expect(gaugeZone(100)).toBe('amber');
  });
  it('red over 100%', () => {
    expect(gaugeZone(100.1)).toBe('red');
    expect(gaugeZone(150)).toBe('red');
  });
});

