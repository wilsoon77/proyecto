import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { ORDER_TRANSITIONS, assertOrderTransition } from './order-state.js';

describe('order state machine', () => {
  it('allows only the configured next states', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.PENDING]).toEqual([
      OrderStatus.CONFIRMED,
      OrderStatus.CANCELLED,
    ]);
    expect(ORDER_TRANSITIONS[OrderStatus.READY]).toEqual([
      OrderStatus.PICKED_UP,
      OrderStatus.IN_DELIVERY,
      OrderStatus.CANCELLED,
    ]);
    expect(ORDER_TRANSITIONS[OrderStatus.DELIVERED]).toEqual([]);
  });

  it('rejects state jumps and terminal-state transitions', () => {
    expect(() => assertOrderTransition(OrderStatus.PENDING, OrderStatus.READY))
      .toThrow(BadRequestException);
    expect(() => assertOrderTransition(OrderStatus.CANCELLED, OrderStatus.CONFIRMED))
      .toThrow(BadRequestException);
  });
});
