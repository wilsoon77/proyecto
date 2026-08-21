import { extractDateRange, routeAssistantQuery } from './assistant-query.js';

describe('assistant query router', () => {
  const branches = [
    { name: 'Sucursal Central', slug: 'central' },
    { name: 'Sucursal Norte', slug: 'norte' },
  ];

  it('resuelve materias primas y sucursal desde una pregunta natural', () => {
    expect(routeAssistantQuery('¿Cuánta azúcar queda en la sucursal Norte?', branches)).toMatchObject({
      kind: 'inventory',
      query: 'azúcar',
      branch: 'norte',
      prefer: 'raw',
    });
  });

  it('resuelve productos próximos a vencer y un periodo relativo', () => {
    expect(routeAssistantQuery('¿Qué productos vencen en los próximos 15 días en Central?', branches)).toMatchObject({
      kind: 'expirations',
      branch: 'central',
      includeExpired: false,
    });
  });

  it('clasifica reportes de producción y cierre', () => {
    expect(routeAssistantQuery('Dame el resumen de producción del 2026-08-10 al 2026-08-12', branches)).toMatchObject({
      kind: 'production',
      fromDate: '2026-08-10',
      toDate: '2026-08-12',
    });
    expect(routeAssistantQuery('¿Cómo cerró la sucursal Norte el 2026-08-10?', branches)).toMatchObject({
      kind: 'dailyClose',
      branch: 'norte',
      fromDate: '2026-08-10',
      toDate: '2026-08-10',
    });
  });

  it('acepta rangos escritos con mes en español y fechas relativas', () => {
    expect(extractDateRange('del 10 al 12 de agosto de 2026', '2026-08-20')).toEqual({
      fromDate: '2026-08-10',
      toDate: '2026-08-12',
    });
    expect(extractDateRange('los últimos 3 días', '2026-08-20')).toEqual({
      fromDate: '2026-08-18',
      toDate: '2026-08-20',
    });
  });

  it('no enruta solicitudes de escritura como consultas de lectura', () => {
    expect(routeAssistantQuery('Registra una compra de azúcar en Central', branches)).toBeNull();
  });
});
