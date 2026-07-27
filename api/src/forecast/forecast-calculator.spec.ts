import { calculateDemandForecast, calculateWape } from './forecast-calculator.js';

function observations(days: number, quantity: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 1 + index));
    return { date: date.toISOString().slice(0, 10), quantity };
  });
}

describe('calculateDemandForecast', () => {
  it('uses the weekly baseline after the minimum history window', () => {
    const result = calculateDemandForecast(observations(90, 20), '2026-04-01');
    expect(result.method).toBe('WMA_WEEKDAY');
    expect(result.predictedQty).toBeCloseTo(20, 5);
    expect(result.lowerBound).toBeLessThanOrEqual(result.predictedQty);
    expect(result.upperBound).toBeGreaterThanOrEqual(result.predictedQty);
  });

  it('falls back to the recent moving average when history is short', () => {
    const result = calculateDemandForecast(observations(14, 8), '2026-01-20');
    expect(result.method).toBe('MOVING_AVERAGE_FALLBACK');
    expect(result.predictedQty).toBeCloseTo(8, 5);
    expect(result.confidence).toBeLessThan(0.3);
  });

  it('returns zero without history and calculates WAPE', () => {
    expect(calculateDemandForecast([], '2026-01-20').method).toBe('NO_HISTORY');
    expect(calculateWape([10, 20], [8, 25])).toBeCloseTo(7 / 30, 5);
  });
});
