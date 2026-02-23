import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { Request } from 'express';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Determinar si es un error HTTP conocido o un error inesperado
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Solo enviar a Sentry errores 500+ (errores del servidor)
    // No enviamos 4xx porque son errores del cliente (validación, auth, etc.)
    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('url', request.url);
        scope.setTag('method', request.method);
        scope.setExtra('body', request.body);
        scope.setExtra('query', request.query);
        scope.setExtra('params', request.params);
        scope.setExtra('headers', {
          'user-agent': request.headers['user-agent'],
          'content-type': request.headers['content-type'],
        });

        // Si hay usuario autenticado, agregar contexto
        if ((request as any).user) {
          scope.setUser({
            id: (request as any).user.id?.toString(),
            email: (request as any).user.email,
          });
        }

        Sentry.captureException(exception);
      });
    }

    super.catch(exception, host);
  }
}
