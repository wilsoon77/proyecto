import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

// Tipo simplificado para el archivo de multer
interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @Roles('ADMIN', 'EMPLOYEE')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const result = await this.storageService.uploadImage(file);
    
    return {
      success: true,
      fileId: result.fileId,
      url: result.url,
      previewUrl: this.storageService.getPreviewUrl(result.fileId, 400, 400),
    };
  }

  @Delete(':fileId')
  @Roles('ADMIN')
  async deleteImage(@Param('fileId') fileId: string) {
    await this.storageService.deleteImage(fileId);
    return { success: true, message: 'Imagen eliminada correctamente' };
  }
}
