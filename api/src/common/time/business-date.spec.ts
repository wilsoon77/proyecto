import {
  getOperatingDays,
  nextOperatingDateKeys,
  operatingDateKeysBetween,
  previousOperatingDateKeys,
} from './business-date.js';

describe('calendario operativo', () => {
  it('usa lunes a sábado por defecto y excluye domingo', () => {
    expect(getOperatingDays(undefined)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(operatingDateKeysBetween('2026-07-19', '2026-07-25', [1, 2, 3, 4, 5, 6])).toEqual([
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
      '2026-07-25',
    ]);
  });

  it('permite configurar otros días operativos', () => {
    expect(getOperatingDays('0,2,6')).toEqual([0, 2, 6]);
    expect(operatingDateKeysBetween('2026-07-19', '2026-07-25', [0, 2, 6])).toEqual([
      '2026-07-19',
      '2026-07-21',
      '2026-07-25',
    ]);
  });

  it('calcula los siguientes y anteriores días de operación', () => {
    expect(nextOperatingDateKeys('2026-07-18', 3, [1, 2, 3, 4, 5, 6])).toEqual([
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
    ]);
    expect(previousOperatingDateKeys('2026-07-20', 3, [1, 2, 3, 4, 5, 6])).toEqual([
      '2026-07-16',
      '2026-07-17',
      '2026-07-18',
    ]);
  });
});
