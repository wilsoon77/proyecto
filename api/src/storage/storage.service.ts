/**
 * Servicio de Storage con Appwrite
 * Maneja la subida y gestión de imágenes de productos
 */

import { Client, Storage, ID } from 'node-appwrite';
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class StorageService {
  private client: Client | null = null;
  private storage: Storage | null = null;
  private bucketId: string;
  private endpoint: string;
  private projectId: string;

  constructor() {
    this.endpoint = process.env.APPWRITE_ENDPOINT || '';
    this.projectId = process.env.APPWRITE_PROJECT_ID || '';
    const apiKey = process.env.APPWRITE_API_KEY;
    this.bucketId = process.env.APPWRITE_BUCKET_ID || 'products';

    if (this.endpoint && this.projectId && apiKey) {
      this.client = new Client()
        .setEndpoint(this.endpoint)
        .setProject(this.projectId)
        .setKey(apiKey);

      this.storage = new Storage(this.client);
      console.log('✅ Appwrite Storage configured:', { endpoint: this.endpoint, bucketId: this.bucketId });
    } else {
      console.warn('⚠️ Appwrite Storage not configured. Missing environment variables.');
    }
  }

  /**
   * Verifica si el servicio está configurado
   */
  isConfigured(): boolean {
    return this.storage !== null;
  }

  /**
   * Sube una imagen y retorna la URL pública
   * @param file - Archivo de multer
   */
  async uploadImage(
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<{ fileId: string; url: string }> {
    if (!this.isConfigured() || !this.storage) {
      throw new BadRequestException('Storage service not configured. Set APPWRITE environment variables.');
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.buffer.length > maxSize) {
      throw new BadRequestException('File too large. Maximum size: 5MB');
    }

    // Generar ID único
    const fileId = ID.unique();
    const ext = file.originalname.split('.').pop() || 'jpg';
    const uniqueFilename = `${fileId}.${ext}`;

    try {
      // Convertir Buffer a Uint8Array y luego a File (Node 20+)
      const uint8Array = new Uint8Array(file.buffer);
      const blob = new Blob([uint8Array], { type: file.mimetype });
      const nativeFile = new File([blob], uniqueFilename, { type: file.mimetype });

      console.log('📁 Uploading file:', { name: uniqueFilename, size: file.buffer.length, type: file.mimetype });

      // Subir a Appwrite
      const result = await this.storage.createFile(
        this.bucketId,
        fileId,
        nativeFile,
      );

      console.log('✅ File uploaded to Appwrite:', result.$id);

      // Construir URL pública
      const url = this.getPublicUrl(result.$id);

      return {
        fileId: result.$id,
        url,
      };
    } catch (error) {
      console.error('❌ Error uploading to Appwrite:', error);
      throw new BadRequestException('Failed to upload image. Check Appwrite configuration.');
    }
  }

  /**
   * Elimina una imagen por su ID
   */
  async deleteImage(fileId: string): Promise<void> {
    if (!this.isConfigured() || !this.storage) {
      return;
    }

    try {
      await this.storage.deleteFile(this.bucketId, fileId);
    } catch (error) {
      console.error('Error deleting from Appwrite:', error);
    }
  }

  /**
   * Obtiene la URL pública de una imagen
   */
  getPublicUrl(fileId: string): string {
    return `${this.endpoint}/storage/buckets/${this.bucketId}/files/${fileId}/view?project=${this.projectId}`;
  }

  /**
   * Obtiene URL de preview (thumbnail) de una imagen
   */
  getPreviewUrl(fileId: string, width = 400, height = 400): string {
    return `${this.endpoint}/storage/buckets/${this.bucketId}/files/${fileId}/preview?project=${this.projectId}&width=${width}&height=${height}`;
  }
}
