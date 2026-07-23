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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StorageService } from './storage.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// Tipo simplificado para el archivo de multer
interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @Roles('ADMIN', 'MANAGER')
  @UseInterceptors(FileInterceptor('file', {
    // Los lÃ­mites se aplican antes de que el buffer llegue al servicio, para
    // evitar reservar memoria por archivos arbitrariamente grandes.
    limits: {
      fileSize: MAX_IMAGE_SIZE_BYTES,
      files: 1,
      fields: 10,
      parts: 11,
    },
    fileFilter: (_request, file, callback) => {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
        callback(new BadRequestException('Tipo de archivo invÃ¡lido. Permitidos: JPEG, PNG, WebP, GIF.'), false);
        return;
      }
      callback(null, true);
    },
  }))
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
