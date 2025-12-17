import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export interface LogContext {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string | number;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level} ${message}${ctx}`;
  }

  log(message: string, context?: LogContext) {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, trace?: string, context?: LogContext) {
    console.error(this.formatMessage(LogLevel.ERROR, message, context));
    if (trace) console.error(trace);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  // Eventos de auditoría específicos
  auditLogin(userId: string, email: string, ip?: string, userAgent?: string) {
    this.info('Usuario autenticado', { userId, email, ip, userAgent, action: 'LOGIN' });
  }

  auditLogout(userId: string, ip?: string) {
    this.info('Sesión cerrada', { userId, ip, action: 'LOGOUT' });
  }

  auditOrderCreated(orderId: number, userId?: string, total?: number) {
    this.info('Orden creada', { orderId, userId, total, action: 'ORDER_CREATE', resource: 'order' });
  }

  auditOrderCancelled(orderId: number, userId?: string) {
    this.info('Orden cancelada', { orderId, userId, action: 'ORDER_CANCEL', resource: 'order' });
  }

  auditOrderPickup(orderId: number, userId?: string) {
    this.info('Orden entregada/recogida', { orderId, userId, action: 'ORDER_PICKUP', resource: 'order' });
  }

  auditStockMovement(productId: number, type: string, quantity: number, fromBranchId?: number, toBranchId?: number, userId?: string) {
    this.info('Movimiento de stock', { 
      productId, 
      type, 
      quantity, 
      fromBranchId, 
      toBranchId, 
      userId, 
      action: 'STOCK_MOVEMENT', 
      resource: 'inventory' 
    });
  }
}
