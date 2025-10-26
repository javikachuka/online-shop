import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export class PasswordResetService {
  /**
   * Genera un token seguro de recuperación de contraseña
   */
  private static generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Crea un token de recuperación de contraseña
   */
  static async createPasswordResetToken(userId: string): Promise<string> {
    try {
      // Invalidar tokens anteriores del usuario
      await this.invalidateExistingTokens(userId);

      // Generar nuevo token
      const token = this.generateSecureToken();
      
      // Crear token con expiración de 1 hora
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await prisma.passwordResetToken.create({
        data: {
          token,
          userId,
          expiresAt,
        },
      });

      return token;
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw new Error('Failed to create password reset token');
    }
  }

  /**
   * Valida un token de recuperación de contraseña
   */
  static async validatePasswordResetToken(token: string): Promise<{
    isValid: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!tokenRecord) {
        return {
          isValid: false,
          error: 'Token inválido'
        };
      }

      // Verificar si ya fue usado
      if (tokenRecord.usedAt) {
        return {
          isValid: false,
          error: 'Este token ya fue utilizado'
        };
      }

      // Verificar si expiró
      if (new Date() > tokenRecord.expiresAt) {
        return {
          isValid: false,
          error: 'El token ha expirado'
        };
      }

      return {
        isValid: true,
        userId: tokenRecord.userId
      };
    } catch (error) {
      console.error('Error validating password reset token:', error);
      return {
        isValid: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Marca un token como usado
   */
  static async markTokenAsUsed(token: string): Promise<void> {
    try {
      await prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      });
    } catch (error) {
      console.error('Error marking token as used:', error);
      throw new Error('Failed to mark token as used');
    }
  }

  /**
   * Invalida todos los tokens existentes de un usuario
   */
  static async invalidateExistingTokens(userId: string): Promise<void> {
    try {
      await prisma.passwordResetToken.updateMany({
        where: {
          userId,
          usedAt: null,
          expiresAt: {
            gt: new Date()
          }
        },
        data: { usedAt: new Date() },
      });
    } catch (error) {
      console.error('Error invalidating existing tokens:', error);
      throw new Error('Failed to invalidate existing tokens');
    }
  }

  /**
   * Limpia tokens expirados (función de mantenimiento)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`Cleaned up ${result.count} expired password reset tokens`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw new Error('Failed to cleanup expired tokens');
    }
  }

  /**
   * Obtiene estadísticas de tokens (útil para monitoreo)
   */
  static async getTokenStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    usedTokens: number;
    expiredTokens: number;
  }> {
    try {
      const now = new Date();
      
      const [totalTokens, usedTokens, expiredTokens] = await Promise.all([
        prisma.passwordResetToken.count(),
        prisma.passwordResetToken.count({
          where: { usedAt: { not: null } }
        }),
        prisma.passwordResetToken.count({
          where: { 
            expiresAt: { lt: now },
            usedAt: null
          }
        })
      ]);

      const activeTokens = totalTokens - usedTokens - expiredTokens;

      return {
        totalTokens,
        activeTokens,
        usedTokens,
        expiredTokens
      };
    } catch (error) {
      console.error('Error getting token stats:', error);
      throw new Error('Failed to get token statistics');
    }
  }
}