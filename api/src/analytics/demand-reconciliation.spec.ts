import { reconcileDemand } from './demand-reconciliation.js';

describe('reconcileDemand', () => {
  it('suma pedidos y ventas residuales del cierre sin duplicarlas', () => {
    expect(reconcileDemand(12, 5)).toEqual({
      orderQty: 12,
      dailyCloseQty: 5,
      totalDemandQty: 17,
      dataQuality: 'COMBINED',
      sourceBreakdown: { orders: 12, dailyCloseResidual: 5 },
    });
  });

  it('normaliza valores inválidos y conserva una sola fuente', () => {
    expect(reconcileDemand(-2, Number.NaN)).toEqual({
      orderQty: 0,
      dailyCloseQty: 0,
      totalDemandQty: 0,
      dataQuality: 'NO_DATA',
      sourceBreakdown: { orders: 0, dailyCloseResidual: 0 },
    });
  });
});
