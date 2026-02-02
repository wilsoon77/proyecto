import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto.js';
import bcryptjs from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Solo ADMIN puede listar todos los usuarios
  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: {
          select: { id: true, name: true, slug: true },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => ({
      ...user,
      orderCount: user._count.orders,
      _count: undefined,
    }));
  }

  // Solo ADMIN puede ver cualquier usuario
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: {
          select: { id: true, name: true, slug: true },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return {
      ...user,
      orderCount: user._count.orders,
      _count: undefined,
    };
  }

  // Solo ADMIN puede crear usuarios con cualquier rol
  async create(createUserDto: CreateUserDto) {
    // Verificar que el email no exista
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException(`Ya existe un usuario con el email ${createUserDto.email}`);
    }

    // Validar que si es EMPLOYEE debe tener branchId
    if (createUserDto.role === 'EMPLOYEE' && !createUserDto.branchId) {
      throw new BadRequestException('Los empleados deben tener una sucursal asignada');
    }

    // Si no es EMPLOYEE, no debería tener branchId
    if (createUserDto.role !== 'EMPLOYEE' && createUserDto.branchId) {
      throw new BadRequestException('Solo los empleados pueden tener una sucursal asignada');
    }

    // Verificar que la sucursal existe si se especifica
    if (createUserDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: createUserDto.branchId },
      });
      if (!branch) {
        throw new BadRequestException(`La sucursal con ID ${createUserDto.branchId} no existe`);
      }
    }

    // Hash de contraseña
    const passwordHash = await bcryptjs.hash(createUserDto.password, 10);

    // Crear usuario
    const { password, ...userData } = createUserDto;
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: {
          select: { id: true, name: true, slug: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // Solo ADMIN puede actualizar cualquier usuario
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verificar que el usuario existe
    const existingUser = await this.findOne(id);

    // Si se está actualizando el email, verificar que no exista otro con ese email
    if (updateUserDto.email) {
      const userWithEmail = await this.prisma.user.findFirst({
        where: { 
          email: updateUserDto.email,
          NOT: { id },
        },
      });

      if (userWithEmail) {
        throw new BadRequestException(`Ya existe un usuario con el email ${updateUserDto.email}`);
      }
    }

    // Determinar el rol final (el del DTO o el existente)
    const finalRole = updateUserDto.role || existingUser.role;
    const finalBranchId = updateUserDto.branchId !== undefined ? updateUserDto.branchId : existingUser.branchId;

    // Validar branchId según el rol
    if (finalRole === 'EMPLOYEE' && !finalBranchId) {
      throw new BadRequestException('Los empleados deben tener una sucursal asignada');
    }

    // Verificar que la sucursal existe si se especifica
    if (updateUserDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: updateUserDto.branchId },
      });
      if (!branch) {
        throw new BadRequestException(`La sucursal con ID ${updateUserDto.branchId} no existe`);
      }
    }

    // Si cambia de EMPLOYEE a otro rol, limpiar branchId
    const shouldClearBranch = updateUserDto.role && updateUserDto.role !== 'EMPLOYEE' && existingUser.role === 'EMPLOYEE';

    // Preparar datos de actualización
    const { password, ...updateData } = updateUserDto;
    const dataToUpdate: any = { ...updateData };

    if (shouldClearBranch) {
      dataToUpdate.branchId = null;
    }

    // Si se está actualizando la contraseña, hashearla
    if (password) {
      dataToUpdate.passwordHash = await bcryptjs.hash(password, 10);
    }

    // Actualizar usuario
    const user = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: {
          select: { id: true, name: true, slug: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // Solo ADMIN puede desactivar usuarios (soft delete)
  async deactivate(id: string, currentUserId: string) {
    // Verificar que el usuario existe
    const user = await this.findOne(id);

    // No permitir que un admin se desactive a sí mismo
    if (id === currentUserId) {
      throw new ForbiddenException('No puedes desactivar tu propia cuenta');
    }

    // Desactivar usuario
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { deactivated: true, id };
  }

  // Reactivar usuario (solo ADMIN)
  async reactivate(id: string) {
    // Verificar que el usuario existe
    await this.findOne(id);

    // Reactivar usuario
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: {
          select: { id: true, name: true, slug: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
