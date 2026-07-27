export type DemandSourceBreakdown = {
  orders: number;
  dailyCloseResidual: number;
};

export function reconcileDemand(orderQty: number, dailyCloseQty: number) {
  const normalizedOrders = Math.max(0, Math.round(Number(orderQty) || 0));
  const normalizedClose = Math.max(0, Math.round(Number(dailyCloseQty) || 0));
  const sourceCount = [normalizedOrders > 0, normalizedClose > 0].filter(Boolean).length;
  const dataQuality = sourceCount === 2
    ? 'COMBINED'
    : sourceCount === 1
      ? normalizedOrders > 0 ? 'ORDER' : 'DAILY_CLOSE'
      : 'NO_DATA';

  return {
    orderQty: normalizedOrders,
    dailyCloseQty: normalizedClose,
    totalDemandQty: normalizedOrders + normalizedClose,
    dataQuality,
    sourceBreakdown: {
      orders: normalizedOrders,
      dailyCloseResidual: normalizedClose,
    } satisfies DemandSourceBreakdown,
  };
}
