import { dateKeyToUtcDate } from '../common/time/business-date.js';

export type DemandObservation = {
  date: string;
  quantity: number;
};

export type DemandForecast = {
  predictedQty: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  historyDays: number;
  method: 'WMA_WEEKDAY' | 'MOVING_AVERAGE_FALLBACK' | 'NO_HISTORY';
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function standardDeviation(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Explainable baseline: recent weighted average plus weekday seasonality.
 * It deliberately has no database or framework dependency so it can be
 * backtested with deterministic unit tests.
 */
export function calculateDemandForecast(
  observations: DemandObservation[],
  forecastDate: string,
): DemandForecast {
  const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((observation) => Math.max(0, Number(observation.quantity) || 0));
  const historyDays = values.length;

  if (historyDays === 0) {
    return {
      predictedQty: 0,
      lowerBound: 0,
      upperBound: 0,
      confidence: 0,
      historyDays: 0,
      method: 'NO_HISTORY',
    };
  }

  const recent = values.slice(-7);
  const weightedTotal = recent.reduce((sum, value, index) => sum + value * (index + 1), 0);
  const weightsTotal = recent.reduce((sum, _value, index) => sum + index + 1, 0);
  const weightedAverage = weightsTotal > 0 ? weightedTotal / weightsTotal : average(recent);
  const targetWeekday = dateKeyToUtcDate(forecastDate).getUTCDay();
  const sameWeekday = sorted
    .filter((observation) => dateKeyToUtcDate(observation.date).getUTCDay() === targetWeekday)
    .slice(-8)
    .map((observation) => Math.max(0, Number(observation.quantity) || 0));

  const historyMean = average(values);
  const deviation = standardDeviation(values, historyMean);
  const hasMinimumHistory = historyDays >= 30;
  const hasWeekdaySamples = sameWeekday.length >= 2;
  const predictedQty = hasMinimumHistory && hasWeekdaySamples
    ? (weightedAverage * 0.4) + (average(sameWeekday) * 0.6)
    : average(recent.length > 0 ? recent : values);
  const uncertainty = Math.max(deviation, predictedQty * 0.15);
  const coverageConfidence = clamp(historyDays / 90, 0, 1);
  const variabilityPenalty = historyMean > 0 ? clamp(deviation / historyMean, 0, 1) : 1;
  const confidence = clamp(coverageConfidence * (1 - variabilityPenalty * 0.35), 0.1, 0.98);

  return {
    predictedQty: Math.max(0, predictedQty),
    lowerBound: Math.max(0, predictedQty - uncertainty),
    upperBound: Math.max(0, predictedQty + uncertainty),
    confidence,
    historyDays,
    method: hasMinimumHistory && hasWeekdaySamples ? 'WMA_WEEKDAY' : 'MOVING_AVERAGE_FALLBACK',
  };
}

export function calculateWape(actual: number[], predicted: number[]): number {
  const length = Math.min(actual.length, predicted.length);
  if (length === 0) return 0;
  const numerator = actual.slice(0, length).reduce((sum, value, index) => sum + Math.abs(value - predicted[index]), 0);
  const denominator = actual.slice(0, length).reduce((sum, value) => sum + Math.abs(value), 0);
  return denominator === 0 ? 0 : numerator / denominator;
}
