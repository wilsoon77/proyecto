import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto.js';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const branches = await this.prisma.branch.findMany({
      include: {
        _count: {
          select: { inventories: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return branches.map(branch => ({
      ...branch,
      inventoryCount: branch._count.inventories,
      _count: undefined,
    }));
  }

  async findOne(id: number) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventories: true },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }

    return {
      ...branch,
      inventoryCount: branch._count.inventories,
      _count: undefined,
    };
  }

  async create(createBranchDto: CreateBranchDto) {
    // Verificar que no exista otra sucursal con el mismo slug
    const existingBranch = await this.prisma.branch.findUnique({
      where: { slug: createBranchDto.slug },
    });

    if (existingBranch) {
      throw new BadRequestException(`Ya existe una sucursal con el slug "${createBranchDto.slug}"`);
    }

    return this.prisma.branch.create({
      data: createBranchDto,
    });
  }

  async update(id: number, updateBranchDto: UpdateBranchDto) {
    // Verificar que la sucursal existe
    await this.findOne(id);

    // Si se está actualizando el slug, verificar que no exista otro con ese slug
    if (updateBranchDto.slug) {
      const existingBranch = await this.prisma.branch.findFirst({
        where: { 
          slug: updateBranchDto.slug,
          NOT: { id },
        },
      });

      if (existingBranch) {
        throw new BadRequestException(`Ya existe una sucursal con el slug "${updateBranchDto.slug}"`);
      }
    }

    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async remove(id: number) {
    // Verificar que la sucursal existe
    const branch = await this.findOne(id);

    // Verificar que no tenga inventarios asociados
    const inventoryCount = await this.prisma.inventory.count({
      where: { branchId: id },
    });

    if (inventoryCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la sucursal "${branch.name}" porque tiene ${inventoryCount} productos en inventario`
      );
    }

    await this.prisma.branch.delete({
      where: { id },
    });

    return { deleted: true, id };
  }
}
