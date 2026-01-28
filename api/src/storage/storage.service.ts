/**
 * Servicio de Storage con Appwrite
 * Maneja la subida y gestión de imágenes de productos
 * Usa la API REST directamente para compatibilidad con todas las versiones de Node
 */

import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class StorageService {
  private bucketId: string;
  private endpoint: string;
  private projectId: string;
  private apiKey: string;
  private configured: boolean = false;

  constructor() {
    this.endpoint = process.env.APPWRITE_ENDPOINT || '';
    this.projectId = process.env.APPWRITE_PROJECT_ID || '';
    this.apiKey = process.env.APPWRITE_API_KEY || '';
    this.bucketId = process.env.APPWRITE_BUCKET_ID || 'products';

    if (this.endpoint && this.projectId && this.apiKey && this.bucketId) {
      this.configured = true;
      console.log('✅ Appwrite Storage configured:', { endpoint: this.endpoint, bucketId: this.bucketId });
    } else {
      console.warn('⚠️ Appwrite Storage not configured. Missing environment variables.');
    }
  }

  /**
   * Verifica si el servicio está configurado
   */
  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Genera un ID único similar a Appwrite
   */
  private generateId(): string {
    return 'unique_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Sube una imagen y retorna la URL pública usando API REST
   * @param file - Archivo de multer
   */
  async uploadImage(
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<{ fileId: string; url: string }> {
    if (!this.isConfigured()) {
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

    const fileId = this.generateId();
    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `${fileId}.${ext}`;

    try {
      // Crear FormData para la API REST de Appwrite
      const formData = new FormData();
      // Convertir Buffer a Uint8Array para compatibilidad con Blob
      const uint8Array = new Uint8Array(file.buffer);
      const blob = new Blob([uint8Array], { type: file.mimetype });
      formData.append('fileId', fileId);
      formData.append('file', blob, filename);

      console.log('📁 Uploading file via REST API:', { name: filename, size: file.buffer.length, type: file.mimetype });

      // Llamar a la API REST de Appwrite directamente
      const response = await fetch(
        `${this.endpoint}/storage/buckets/${this.bucketId}/files`,
        {
          method: 'POST',
          headers: {
            'X-Appwrite-Project': this.projectId,
            'X-Appwrite-Key': this.apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Appwrite API error:', response.status, errorText);
        throw new Error(`Appwrite error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
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
   * Elimina una imagen por su ID usando API REST
   */
  async deleteImage(fileId: string): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    try {
      const response = await fetch(
        `${this.endpoint}/storage/buckets/${this.bucketId}/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'X-Appwrite-Project': this.projectId,
            'X-Appwrite-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        console.error('Error deleting from Appwrite:', response.status);
      }
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
