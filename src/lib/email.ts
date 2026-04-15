import { Resend } from 'resend';

interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationPayload {
  orderId: string;
  customerName: string;
  items: OrderEmailItem[];
  total: number;
  shippingAddress?: string;
  paymentMethodName?: string;
  deliveryMethod?: string;
}

interface TransferInstructionsPayload {
  bankName?: string;
  accountHolder?: string;
  cbu?: string;
  cvu?: string;
  alias?: string;
  accountNumber?: string;
  reservationHours?: number;
}

interface EmailLayoutOptions {
  title: string;
  subtitle: string;
  introHtml: string;
  bodyHtml: string;
  accentColor: string;
}

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

  private async send({
    to,
    subject,
    html,
    context,
  }: {
    to: string;
    subject: string;
    html: string;
    context: string; // e.g. 'welcome | user@x.com'
  }): Promise<void> {
    const from = this.getFromEmail();

    const response = await this.resend.emails.send({ from, to, subject, html });

    if (response.error) {
      const { name, message, statusCode } = response.error as { name: string; message: string; statusCode: number };
      console.error(
        `[EmailService] Send failed | context=${context} | from=${from} | to=${to} | status=${statusCode} | ${name}: ${message}`
      );
      throw new Error(`[EmailService] ${name} (${statusCode}): ${message}`);
    }

    console.log(`[EmailService] Sent | context=${context} | to=${to} | id=${response.data?.id}`);
  }

  private getCompanyName(): string {
    return process.env.COMPANY_NAME || 'Tu Empresa';
  }

  private getSupportEmail(): string {
    return process.env.SUPPORT_EMAIL || 'support@example.com';
  }

  private getBaseUrl(): string {
    return process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  private escapeHtml(value: string = ''): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  }

  private renderOrderRows(items: OrderEmailItem[]): string {
    return items.map((item) => `
      <tr>
        <td>${this.escapeHtml(item.name)}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">${this.formatCurrency(item.price)}</td>
        <td style="text-align:right;">${this.formatCurrency(item.quantity * item.price)}</td>
      </tr>
    `).join('');
  }

  private renderEmailLayout({ title, subtitle, introHtml, bodyHtml, accentColor }: EmailLayoutOptions): string {
    const companyName = this.escapeHtml(this.getCompanyName());
    const supportEmail = this.escapeHtml(this.getSupportEmail());

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
    }
    .wrapper {
      width: 100%;
      padding: 24px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
    }
    .header {
      background: ${accentColor};
      color: #ffffff;
      padding: 28px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 8px;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      font-size: 15px;
      opacity: 0.95;
    }
    .content {
      padding: 28px 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 16px;
      margin: 16px 0;
    }
    .button {
      display: inline-block;
      background: ${accentColor};
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 22px;
      border-radius: 8px;
      font-weight: bold;
      margin: 12px 0;
    }
    .muted {
      color: #6b7280;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th {
      background: #f3f4f6;
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid #d1d5db;
      font-size: 13px;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .total-row td {
      font-weight: bold;
      background: #f9fafb;
    }
    .footer {
      padding: 18px 24px 28px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .info-list {
      list-style: none;
      padding: 0;
      margin: 12px 0 0;
    }
    .info-list li {
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-list li:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${companyName}</h1>
        <p>${this.escapeHtml(subtitle)}</p>
      </div>

      <div class="content">
        <h2 style="margin-top:0;">${this.escapeHtml(title)}</h2>
        ${introHtml}
        ${bodyHtml}
      </div>

      <div class="footer">
        <p>Si necesitás ayuda, podés escribirnos a <strong>${supportEmail}</strong>.</p>
        <p>© ${new Date().getFullYear()} ${companyName}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userName: string): Promise<void> {
    try {
      const resetUrl = `${this.getBaseUrl()}/auth/reset-password?token=${resetToken}`;
      const htmlContent = this.renderEmailLayout({
        title: 'Recuperación de contraseña',
        subtitle: 'Solicitud segura de restablecimiento',
        accentColor: '#2563eb',
        introHtml: `<p>Hola <strong>${this.escapeHtml(userName)}</strong>,</p>`,
        bodyHtml: `
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no fuiste vos, podés ignorar este mensaje con tranquilidad.</p>
          <div style="text-align:center;">
            <a href="${resetUrl}" class="button">Restablecer contraseña</a>
          </div>
          <div class="card">
            <p style="margin-top:0;"><strong>Link alternativo</strong></p>
            <p class="muted" style="word-break: break-all; margin-bottom:0;">${this.escapeHtml(resetUrl)}</p>
          </div>
          <div class="card" style="border-left: 4px solid #f59e0b;">
            <strong>Importante:</strong> este enlace expirará en 1 hora por motivos de seguridad.
          </div>
        `,
      });

      await this.send({
        to,
        subject: `Recuperar contraseña - ${this.getCompanyName()}`,
        html: htmlContent,
        context: `password-reset | ${to}`,
      });
    } catch (error) {
      console.error('[EmailService] Error in sendPasswordResetEmail:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    try {
      const storeUrl = this.getBaseUrl();
      const htmlContent = this.renderEmailLayout({
        title: '¡Bienvenido!',
        subtitle: 'Tu cuenta ya está lista para comprar',
        accentColor: '#16a34a',
        introHtml: `<p>Hola <strong>${this.escapeHtml(userName)}</strong>,</p>`,
        bodyHtml: `
          <p>Gracias por registrarte en ${this.escapeHtml(this.getCompanyName())}. Ya podés explorar el catálogo y realizar tu primera compra.</p>
          <div style="text-align:center;">
            <a href="${storeUrl}" class="button">Explorar productos</a>
          </div>
          <p class="muted">Estamos para ayudarte en lo que necesites.</p>
        `,
      });

      await this.send({
        to,
        subject: `¡Bienvenido a ${this.getCompanyName()}!`,
        html: htmlContent,
        context: `welcome | ${to}`,
      });
    } catch (error) {
      console.error('[EmailService] Error in sendWelcomeEmail:', error);
      throw error;
    }
  }

  async sendOrderConfirmationEmail(to: string, orderData: OrderConfirmationPayload): Promise<void> {
    try {
      const orderUrl = `${this.getBaseUrl()}/orders/${orderData.orderId}`;
      const itemsHTML = this.renderOrderRows(orderData.items);
      const htmlContent = this.renderEmailLayout({
        title: `Pago confirmado para tu pedido #${orderData.orderId}`,
        subtitle: 'Tu compra fue acreditada correctamente',
        accentColor: '#16a34a',
        introHtml: `<p>Hola <strong>${this.escapeHtml(orderData.customerName)}</strong>,</p>`,
        bodyHtml: `
          <p>Te confirmamos que recibimos el pago de tu pedido y ya comenzamos a prepararlo.</p>
          <div class="card">
            <p style="margin:0 0 8px;"><strong>Método de pago:</strong> ${this.escapeHtml(orderData.paymentMethodName || 'Pago confirmado')}</p>
            <p style="margin:0;"><strong>Modalidad de entrega:</strong> ${orderData.deliveryMethod === 'pickup' ? 'Retiro en local' : 'Envío a domicilio'}</p>
          </div>

          <h3>Resumen de la compra</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align:center;">Cant.</th>
                <th style="text-align:right;">Precio</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
              <tr class="total-row">
                <td colspan="3" style="text-align:right;">Total</td>
                <td style="text-align:right;">${this.formatCurrency(orderData.total)}</td>
              </tr>
            </tbody>
          </table>

          ${orderData.shippingAddress ? `
            <div class="card">
              <p style="margin:0 0 6px;"><strong>Dirección de referencia</strong></p>
              <p style="margin:0;">${this.escapeHtml(orderData.shippingAddress)}</p>
            </div>
          ` : ''}

          <div style="text-align:center;">
            <a href="${orderUrl}" class="button">Ver mi pedido</a>
          </div>
        `,
      });

      await this.send({
        to,
        subject: `Pago confirmado - Pedido #${orderData.orderId}`,
        html: htmlContent,
        context: `order-confirmation | order=${orderData.orderId} | ${to}`,
      });
    } catch (error) {
      console.error('[EmailService] Error in sendOrderConfirmationEmail:', error);
      throw error;
    }
  }

  async sendTransferInstructionsEmail(
    to: string,
    orderData: OrderConfirmationPayload,
    transferData: TransferInstructionsPayload
  ): Promise<void> {
    try {
      const orderUrl = `${this.getBaseUrl()}/orders/${orderData.orderId}`;
      const itemsHTML = this.renderOrderRows(orderData.items);
      const reservationHours = transferData.reservationHours ?? 12;

      const transferDetails = [
        transferData.bankName ? `<li><strong>Banco:</strong> ${this.escapeHtml(transferData.bankName)}</li>` : '',
        transferData.accountHolder ? `<li><strong>Titular:</strong> ${this.escapeHtml(transferData.accountHolder)}</li>` : '',
        transferData.cbu ? `<li><strong>CBU:</strong> ${this.escapeHtml(transferData.cbu)}</li>` : '',
        transferData.cvu ? `<li><strong>CVU:</strong> ${this.escapeHtml(transferData.cvu)}</li>` : '',
        transferData.alias ? `<li><strong>Alias:</strong> ${this.escapeHtml(transferData.alias)}</li>` : '',
        transferData.accountNumber ? `<li><strong>Número de cuenta:</strong> ${this.escapeHtml(transferData.accountNumber)}</li>` : '',
      ].filter(Boolean).join('');

      const htmlContent = this.renderEmailLayout({
        title: `Instrucciones para tu transferencia - Pedido #${orderData.orderId}`,
        subtitle: 'Recibimos tu pedido y reservamos tus productos',
        accentColor: '#2563eb',
        introHtml: `<p>Hola <strong>${this.escapeHtml(orderData.customerName)}</strong>,</p>`,
        bodyHtml: `
          <p>Tu pedido fue generado correctamente. Para acreditarlo, necesitás realizar la transferencia por el <strong>monto total de ${this.formatCurrency(orderData.total)}</strong>.</p>

          <div class="card">
            <p style="margin-top:0;"><strong>Reserva de productos</strong></p>
            <p style="margin-bottom:0;">Los productos quedarán reservados durante <strong>${reservationHours} horas</strong>. Si el pago no se acredita en ese plazo, la orden podrá cancelarse automáticamente.</p>
          </div>

          <h3>Resumen de la compra</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align:center;">Cant.</th>
                <th style="text-align:right;">Precio</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
              <tr class="total-row">
                <td colspan="3" style="text-align:right;">Total a transferir</td>
                <td style="text-align:right;">${this.formatCurrency(orderData.total)}</td>
              </tr>
            </tbody>
          </table>

          <div class="card">
            <p style="margin-top:0;"><strong>Datos bancarios</strong></p>
            <ul class="info-list">
              ${transferDetails || '<li>Próximamente te compartiremos los datos bancarios.</li>'}
            </ul>
          </div>

          ${orderData.shippingAddress ? `
            <div class="card">
              <p style="margin:0 0 6px;"><strong>Dirección de referencia</strong></p>
              <p style="margin:0;">${this.escapeHtml(orderData.shippingAddress)}</p>
            </div>
          ` : ''}

          <div style="text-align:center;">
            <a href="${orderUrl}" class="button">Ver estado de mi pedido</a>
          </div>
        `,
      });

      await this.send({
        to,
        subject: `Instrucciones de transferencia - Pedido #${orderData.orderId}`,
        html: htmlContent,
        context: `transfer-instructions | order=${orderData.orderId} | ${to}`,
      });
    } catch (error) {
      console.error('[EmailService] Error in sendTransferInstructionsEmail:', error);
      throw error;
    }
  }
}

export const emailService = EmailService.getInstance();