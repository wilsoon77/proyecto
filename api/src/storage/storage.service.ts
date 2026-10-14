/**
 * Servicio de Storage con Supabase
 * Maneja la subida y gestion de imagenes de productos
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient | null = null;
  private bucketId: string;
  private supabaseUrl: string;
  private configured: boolean = false;

  constructor() {
    this.supabaseUrl = (process.env.SUPABASE_URL || '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    this.bucketId = (process.env.SUPABASE_PRODUCTS_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'products').trim();

    if (this.supabaseUrl && serviceRoleKey) {
      this.supabase = createClient(this.supabaseUrl, serviceRoleKey);
      this.configured = true;
      console.log('[StorageService] Supabase Storage configurado:', { url: this.supabaseUrl, bucketId: this.bucketId });
    } else {
      console.warn('[StorageService] Supabase Storage no configurado. Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
    }
  }

  /**
   * Verifica si el servicio esta configurado
   */
  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Genera un identificador unico para el archivo
   */
  private generateId(): string {
    return 'prod_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Sube una imagen y retorna la URL publica
   * @param file - Archivo proveniente de multer
   */
  async uploadImage(
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<{ fileId: string; url: string }> {
    if (!this.isConfigured() || !this.supabase) {
      throw new BadRequestException('El servicio de almacenamiento no esta configurado.');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Permitidos: JPEG, PNG, WebP, GIF, AVIF.');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.buffer.length > maxSize) {
      throw new BadRequestException('El archivo supera el tamano maximo permitido de 5MB.');
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const fileId = `${this.generateId()}.${ext}`;

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketId)
        .upload(fileId, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        console.error('[StorageService] Error al subir a Supabase Storage:', error.message);
        throw new Error(`Error de subida en Supabase Storage: ${error.message}`);
      }

      const url = this.getPublicUrl(fileId);

      return {
        fileId,
        url,
      };
    } catch (error) {
      console.error('[StorageService] Error subiendo imagen:', error);
      throw new BadRequestException('Fallo al subir la imagen a Supabase Storage.');
    }
  }

  /**
   * Elimina una imagen por su ID / path en el bucket
   */
  async deleteImage(fileId: string): Promise<void> {
    if (!this.isConfigured() || !this.supabase) {
      return;
    }

    try {
      const filesToDelete = [fileId];
      if (!fileId.includes('.')) {
        filesToDelete.push(
          `${fileId}.jpg`,
          `${fileId}.png`,
          `${fileId}.webp`,
          `${fileId}.gif`
        );
      }

      const { error } = await this.supabase.storage
        .from(this.bucketId)
        .remove(filesToDelete);

      if (error) {
        console.error('[StorageService] Error al eliminar imagen de Supabase Storage:', error.message);
      }
    } catch (error) {
      console.error('[StorageService] Excepcion al eliminar imagen:', error);
    }
  }

  /**
   * Obtiene la URL publica de una imagen
   */
  getPublicUrl(fileId: string): string {
    if (!this.supabase) {
      return `${this.supabaseUrl}/storage/v1/object/public/${this.bucketId}/${fileId}`;
    }
    const { data } = this.supabase.storage.from(this.bucketId).getPublicUrl(fileId);
    return data.publicUrl;
  }

  /**
   * Obtiene URL de preview (en Supabase Next.js se encarga de la optimizacion)
   */
  getPreviewUrl(fileId: string, _width = 400, _height = 400): string {
    return this.getPublicUrl(fileId);
  }
}
