import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'PENDIENTE',
  CONFIRMED: 'CONFIRMADO',
  PREPARING: 'EN PREPARACIÓN',
  READY: 'LISTO PARA RECOGER',
  IN_DELIVERY: 'EN CAMINO',
  DELIVERED: 'ENTREGADO',
  CANCELLED: 'CANCELADO',
  PICKED_UP: 'RECOGIDO',
};

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.PICKED_UP, OrderStatus.IN_DELIVERY, OrderStatus.CANCELLED],
  IN_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
  PICKED_UP: [],
};

export const FULFILLMENT_STATUSES = new Set<OrderStatus>([
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERED,
]);

export function assertOrderTransition(current: OrderStatus, next: OrderStatus) {
  if (!ORDER_TRANSITIONS[current].includes(next)) {
    throw new BadRequestException(`No se permite cambiar una orden de ${current} a ${next}`);
  }
}
