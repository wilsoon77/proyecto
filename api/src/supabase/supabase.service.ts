import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase!: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados. Supabase Auth deshabilitado.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get admin() {
    return this.supabase?.auth.admin;
  }

  /**
   * Password authentication is delegated to Supabase whenever it is enabled.
   * The API still issues its own short-lived access token after this check.
   */
  async signInWithPassword(email: string, password: string) {
    if (!this.supabase) {
      throw new ServiceUnavailableException('Supabase Auth no estÃ¡ configurado.');
    }
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  isConfigured(): boolean {
    return !!this.supabase;
  }

  /**
   * Obtiene la identidad desde un JWT emitido por Supabase. El JWT se valida
   * contra Auth; no se aceptan IDs, correos ni metadatos enviados por el
   * cliente como prueba de identidad.
   */
  async getUser(accessToken: string): Promise<User> {
    if (!this.supabase) {
      throw new ServiceUnavailableException('Supabase Auth no está configurado.');
    }

    const { data, error } = await this.supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new UnauthorizedException('Access token de Supabase inválido o expirado.');
    }

    return data.user;
  }
}
