'use server';

import { prisma } from '@/lib/prisma';
import { PasswordResetService } from '@/lib/password-reset';
import { EmailService } from '@/lib/email';
import bcryptjs from 'bcryptjs';

export async function requestPasswordReset(email: string): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        ok: false,
        message: 'Por favor, ingresa un email válido'
      };
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Por seguridad, siempre devolvemos el mismo mensaje
    // No revelamos si el email existe o no en nuestro sistema
    const successMessage = 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación en unos minutos.';

    if (!user) {
      // Log interno para debugging, pero no revelamos al usuario
      console.log(`Password reset requested for non-existent email: ${email}`);
      return {
        ok: true,
        message: successMessage
      };
    }

    // Crear token de recuperación
    const resetToken = await PasswordResetService.createPasswordResetToken(user.id);

    // Enviar email
    const emailService = EmailService.getInstance();
    await emailService.sendPasswordResetEmail(
      user.email, 
      resetToken, 
      `${user.firstName} ${user.lastName}`
    );

    console.log(`Password reset email sent to: ${user.email}`);

    return {
      ok: true,
      message: successMessage
    };

  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    
    return {
      ok: false,
      message: 'Ocurrió un error interno. Por favor, intenta nuevamente más tarde.'
    };
  }
}

export async function validateResetToken(token: string): Promise<{
  ok: boolean;
  message: string;
  userId?: string;
}> {
  try {
    if (!token) {
      return {
        ok: false,
        message: 'Token no proporcionado'
      };
    }

    const validation = await PasswordResetService.validatePasswordResetToken(token);

    if (!validation.isValid) {
      return {
        ok: false,
        message: validation.error || 'Token inválido'
      };
    }

    return {
      ok: true,
      message: 'Token válido',
      userId: validation.userId
    };

  } catch (error) {
    console.error('Error in validateResetToken:', error);
    
    return {
      ok: false,
      message: 'Error interno del servidor'
    };
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    // Validaciones básicas
    if (!token) {
      return {
        ok: false,
        message: 'Token no proporcionado'
      };
    }

    if (!newPassword) {
      return {
        ok: false,
        message: 'La nueva contraseña es requerida'
      };
    }

    // Validar fortaleza de contraseña
    if (newPassword.length < 6) {
      return {
        ok: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      };
    }

    // Validar token
    const validation = await PasswordResetService.validatePasswordResetToken(token);

    if (!validation.isValid) {
      return {
        ok: false,
        message: validation.error || 'Token inválido'
      };
    }

    // Hash de la nueva contraseña
    const hashedPassword = bcryptjs.hashSync(newPassword, 10);

    // Actualizar contraseña del usuario y marcar token como usado
    await Promise.all([
      prisma.user.update({
        where: { id: validation.userId },
        data: { password: hashedPassword }
      }),
      PasswordResetService.markTokenAsUsed(token)
    ]);

    console.log(`Password successfully reset for user: ${validation.userId}`);

    return {
      ok: true,
      message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.'
    };

  } catch (error) {
    console.error('Error in resetPassword:', error);
    
    return {
      ok: false,
      message: 'Ocurrió un error interno. Por favor, intenta nuevamente.'
    };
  }
}

export async function sendWelcomeEmail(userId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return {
        ok: false,
        message: 'Usuario no encontrado'
      };
    }

    // Enviar email de bienvenida
    const emailService = EmailService.getInstance();
    await emailService.sendWelcomeEmail(
      user.email, 
      `${user.firstName} ${user.lastName}`
    );

    console.log(`Welcome email sent to: ${user.email}`);

    return {
      ok: true,
      message: 'Email de bienvenida enviado correctamente'
    };

  } catch (error) {
    console.error('Error in sendWelcomeEmail:', error);
    
    return {
      ok: false,
      message: 'Error enviando email de bienvenida'
    };
  }
}

export async function sendOrderConfirmationEmail(orderId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    // Buscar orden con detalles completos
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        OrderItem: {
          include: {
            product: true,
            variant: {
              include: {
                attributes: {
                  include: {
                    attribute: true
                  }
                }
              }
            }
          }
        },
        OrderAddress: true
      }
    });

    if (!order) {
      return {
        ok: false,
        message: 'Orden no encontrada'
      };
    }

    // Preparar datos para el email
    const orderData = {
      orderId: order.id,
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      items: order.OrderItem.map(item => ({
        name: item.product.title,
        quantity: item.quantity,
        price: item.price
      })),
      total: order.total,
      shippingAddress: order.OrderAddress ? 
        `${order.OrderAddress.firstName} ${order.OrderAddress.lastName}, ${order.OrderAddress.address}, ${order.OrderAddress.city}, ${order.OrderAddress.postalCode}` 
        : undefined
    };

    // Enviar email
    const emailService = EmailService.getInstance();
    await emailService.sendOrderConfirmationEmail(order.user.email, orderData);

    console.log(`Order confirmation email sent for order: ${orderId}`);

    return {
      ok: true,
      message: 'Email de confirmación enviado correctamente'
    };

  } catch (error) {
    console.error('Error in sendOrderConfirmationEmail:', error);
    
    return {
      ok: false,
      message: 'Error enviando email de confirmación'
    };
  }
}