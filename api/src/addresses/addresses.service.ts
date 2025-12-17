import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto.js';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  // ADMIN puede ver todas las direcciones, usuarios normales solo las suyas
  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    
    return this.prisma.address.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Usuario puede ver sus direcciones, ADMIN puede ver cualquiera
  async findOne(id: number, userId?: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Dirección con ID ${id} no encontrada`);
    }

    // Si no es ADMIN (userId está presente), verificar que la dirección pertenezca al usuario
    if (userId && address.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a esta dirección');
    }

    return address;
  }

  // Crear dirección para el usuario autenticado
  async create(createAddressDto: CreateAddressDto, userId: string) {
    return this.prisma.address.create({
      data: {
        ...createAddressDto,
        userId,
      },
    });
  }

  // Usuario puede actualizar sus direcciones, ADMIN puede actualizar cualquiera
  async update(id: number, updateAddressDto: UpdateAddressDto, userId?: string) {
    // Verificar que la dirección existe y pertenece al usuario (si no es ADMIN)
    await this.findOne(id, userId);

    return this.prisma.address.update({
      where: { id },
      data: updateAddressDto,
    });
  }

  // Usuario puede eliminar sus direcciones, ADMIN puede eliminar cualquiera
  async remove(id: number, userId?: string) {
    // Verificar que la dirección existe y pertenece al usuario (si no es ADMIN)
    const address = await this.findOne(id, userId);

    // Verificar que no tenga pedidos asociados
    const orderCount = await this.prisma.order.count({
      where: { addressId: id },
    });

    if (orderCount > 0) {
      throw new ForbiddenException(
        `No se puede eliminar esta dirección porque tiene ${orderCount} pedidos asociados`
      );
    }

    await this.prisma.address.delete({
      where: { id },
    });

    return { deleted: true, id };
  }
}
