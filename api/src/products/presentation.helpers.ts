import { BadRequestException } from '@nestjs/common';

export type PresentationConversion = {
  id: number;
  name: string;
  unitsInStock: number;
  isActive?: boolean;
  isForSale?: boolean;
  isForProduction?: boolean;
};

export type PresentationCountInput = {
  presentationId: number;
  quantity: number;
};

/**
 * Convierte cantidades comerciales (tiras, medias tiras, paquetes, etc.) a
 * la unidad física base usada por Inventory. Mantener esta operación en un
 * helper compartido evita que cada flujo haga una conversión distinta.
 */
export function calculateBaseQuantity(
  presentations: PresentationConversion[],
  counts: PresentationCountInput[] | undefined,
  label = 'presentación',
): number {
  if (!counts?.length) return 0;

  const byId = new Map(presentations.map((presentation) => [presentation.id, presentation]));
  const seen = new Set<number>();
  let total = 0;

  for (const count of counts) {
    if (!Number.isInteger(count.presentationId) || count.presentationId < 1) {
      throw new BadRequestException(`ID de ${label} inválido`);
    }
    if (seen.has(count.presentationId)) {
      throw new BadRequestException(`No se puede repetir una ${label}`);
    }
    seen.add(count.presentationId);

    if (!Number.isInteger(count.quantity) || count.quantity < 0) {
      throw new BadRequestException(`La cantidad de ${label} debe ser un entero mayor o igual a cero`);
    }

    const presentation = byId.get(count.presentationId);
    if (!presentation || presentation.isActive === false) {
      throw new BadRequestException(`${label} no pertenece al producto o está inactiva`);
    }
    if (!Number.isInteger(presentation.unitsInStock) || presentation.unitsInStock < 1) {
      throw new BadRequestException(`La ${label} no tiene una equivalencia válida`);
    }

    total += count.quantity * presentation.unitsInStock;
  }

  return total;
}

export function getDefaultPresentation<T extends PresentationConversion>(presentations: T[]): T | undefined {
  return presentations.find((presentation) => presentation.isActive !== false && presentation.isForSale !== false)
    ?? presentations.find((presentation) => presentation.isActive !== false);
}

