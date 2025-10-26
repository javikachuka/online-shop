import { Resend } from 'resend';

// Instancia global de Resend
let resend: Resend | null = null;

export class EmailService {
  private static instance: EmailService;
  private resend: Resend;

  private constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not defined in environment variables');
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private getFromEmail(): string {
    return process.env.FROM_EMAIL || 'noreply@example.com';
  }

  private getCompanyName(): string {
    return process.env.COMPANY_NAME || 'Tu Empresa';
  }

  private getSupportEmail(): string {
    return process.env.SUPPORT_EMAIL || 'support@example.com';
  }

  /**
   * Envía un email de recuperación de contraseña
   */
  async sendPasswordResetEmail(to: string, resetToken: string, userName: string): Promise<void> {
    try {
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
      const companyName = this.getCompanyName();
      
      const htmlContent = this.generatePasswordResetHTML(userName, resetUrl, companyName);
      
      await this.resend.emails.send({
        from: this.getFromEmail(),
        to,
        subject: `Recuperar contraseña - ${companyName}`,
        html: htmlContent,
      });

      console.log(`Password reset email sent to: ${to}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Envía un email de bienvenida
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    try {
      const companyName = this.getCompanyName();
      const htmlContent = this.generateWelcomeHTML(userName, companyName);
      
      await this.resend.emails.send({
        from: this.getFromEmail(),
        to,
        subject: `¡Bienvenido a ${companyName}!`,
        html: htmlContent,
      });

      console.log(`Welcome email sent to: ${to}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Envía un email de confirmación de pedido
   */
  async sendOrderConfirmationEmail(
    to: string, 
    orderData: {
      orderId: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      total: number;
      shippingAddress?: string;
    }
  ): Promise<void> {
    try {
      const companyName = this.getCompanyName();
      const htmlContent = this.generateOrderConfirmationHTML(orderData, companyName);
      
      await this.resend.emails.send({
        from: this.getFromEmail(),
        to,
        subject: `Confirmación de pedido #${orderData.orderId} - ${companyName}`,
        html: htmlContent,
      });

      console.log(`Order confirmation email sent to: ${to} for order: ${orderData.orderId}`);
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw new Error('Failed to send order confirmation email');
    }
  }

  /**
   * Genera HTML para email de recuperación de contraseña
   */
  private generatePasswordResetHTML(userName: string, resetUrl: string, companyName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar contraseña</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .content { padding: 20px 0; }
        .button { 
            display: inline-block; 
            background-color: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .footer { font-size: 12px; color: #666; margin-top: 30px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${companyName}</h1>
            <h2>Recuperación de contraseña</h2>
        </div>
        
        <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no solicitaste este cambio, puedes ignorar este correo.</p>
            
            <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer contraseña</a>
            </div>
            
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${resetUrl}
            </p>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad.
            </div>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
            
            <p>Saludos,<br>El equipo de ${companyName}</p>
        </div>
        
        <div class="footer">
            <p>Si no solicitaste este cambio, tu cuenta sigue siendo segura. Este enlace expirará automáticamente.</p>
            <p>Para más ayuda, contacta a: ${this.getSupportEmail()}</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Genera HTML para email de bienvenida
   */
  private generateWelcomeHTML(userName: string, companyName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Bienvenido!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .content { padding: 20px 0; }
        .button { 
            display: inline-block; 
            background-color: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .footer { font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido a ${companyName}!</h1>
        </div>
        
        <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <p>¡Gracias por registrarte en ${companyName}! Estamos emocionados de tenerte como parte de nuestra comunidad.</p>
            
            <p>Tu cuenta ha sido creada exitosamente y ya puedes comenzar a explorar nuestros productos.</p>
            
            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="button">Explorar productos</a>
            </div>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estamos aquí para ayudarte.</p>
            
            <p>¡Esperamos que disfrutes tu experiencia de compra!</p>
            
            <p>Saludos,<br>El equipo de ${companyName}</p>
        </div>
        
        <div class="footer">
            <p>Para más ayuda, contacta a: ${this.getSupportEmail()}</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Genera HTML para email de confirmación de pedido
   */
  private generateOrderConfirmationHTML(
    orderData: {
      orderId: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      total: number;
      shippingAddress?: string;
    }, 
    companyName: string
  ): string {
    const itemsHTML = orderData.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de pedido</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .content { padding: 20px 0; }
        .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-table th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
        .order-table td { padding: 8px; border-bottom: 1px solid #ddd; }
        .total-row { font-weight: bold; background-color: #f8f9fa; }
        .footer { font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${companyName}</h1>
            <h2>¡Tu pedido ha sido confirmado!</h2>
        </div>
        
        <div class="content">
            <p>Hola <strong>${orderData.customerName}</strong>,</p>
            
            <p>Gracias por tu compra. Hemos recibido tu pedido <strong>#${orderData.orderId}</strong> y lo estamos procesando.</p>
            
            <h3>Detalles del pedido:</h3>
            
            <table class="order-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th style="text-align: center;">Cantidad</th>
                        <th style="text-align: right;">Precio unitario</th>
                        <th style="text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                    <tr class="total-row">
                        <td colspan="3" style="text-align: right; padding: 12px;">Total:</td>
                        <td style="text-align: right; padding: 12px;">$${orderData.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            
            ${orderData.shippingAddress ? `
            <h3>Dirección de envío:</h3>
            <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${orderData.shippingAddress}
            </p>
            ` : ''}
            
            <p>Te notificaremos cuando tu pedido sea enviado junto con la información de seguimiento.</p>
            
            <p>Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.</p>
            
            <p>¡Gracias por elegirnos!</p>
            
            <p>Saludos,<br>El equipo de ${companyName}</p>
        </div>
        
        <div class="footer">
            <p>Para consultas sobre tu pedido, contacta a: ${this.getSupportEmail()}</p>
            <p>Número de pedido: ${orderData.orderId}</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

// Export de conveniencia para usar en otras partes de la aplicación
export const emailService = EmailService.getInstance();