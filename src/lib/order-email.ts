import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email';

function buildShippingAddress(order: {
  OrderAddress: {
    firstName: string;
    lastName: string;
    address: string;
    address2: string | null;
    city: string;
    postalCode: string;
  } | null;
}) {
  if (!order.OrderAddress) return undefined;

  const { firstName, lastName, address, address2, city, postalCode } = order.OrderAddress;

  return [
    `${firstName} ${lastName}`.trim(),
    address,
    address2,
    city,
    postalCode,
  ]
    .filter(Boolean)
    .join(', ');
}

async function getOrderEmailContext(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      company: true,
      paymentMethod: true,
      OrderItem: {
        include: {
          product: true,
        },
      },
      OrderAddress: true,
    },
  });

  if (!order) {
    throw new Error('Orden no encontrada');
  }

  return {
    order,
    customerName: `${order.user.firstName} ${order.user.lastName}`.trim(),
    items: order.OrderItem.map((item) => ({
      name: item.product.title,
      quantity: item.quantity,
      price: item.price,
    })),
    shippingAddress: buildShippingAddress(order),
  };
}

export async function sendOrderPaymentConfirmationEmail(orderId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const { order, customerName, items, shippingAddress } = await getOrderEmailContext(orderId);

    const emailService = EmailService.getInstance();
    await emailService.sendOrderConfirmationEmail(order.user.email, {
      orderId: order.id,
      customerName,
      items,
      total: order.total,
      shippingAddress,
      paymentMethodName: order.paymentMethod?.name ?? undefined,
      deliveryMethod: order.deliveryMethod,
    });

    return {
      ok: true,
      message: 'Email de confirmación de pago enviado correctamente',
    };
  } catch (error) {
    console.error('Error in sendOrderPaymentConfirmationEmail:', error);

    return {
      ok: false,
      message: 'Error enviando email de confirmación de pago',
    };
  }
}

export async function sendOrderTransferInstructionsEmail(orderId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const { order, customerName, items, shippingAddress } = await getOrderEmailContext(orderId);

    const emailService = EmailService.getInstance();
    await emailService.sendTransferInstructionsEmail(order.user.email, {
      orderId: order.id,
      customerName,
      items,
      total: order.total,
      shippingAddress,
      paymentMethodName: order.paymentMethod?.name ?? 'Transferencia bancaria',
      deliveryMethod: order.deliveryMethod,
    }, {
      bankName: order.company?.bankName ?? undefined,
      accountHolder: order.company?.accountHolder ?? undefined,
      cbu: order.company?.cbu ?? undefined,
      cvu: order.company?.cvu ?? undefined,
      alias: order.company?.alias ?? undefined,
      accountNumber: order.company?.accountNumber ?? undefined,
      reservationHours: 12,
    });

    return {
      ok: true,
      message: 'Email con instrucciones de transferencia enviado correctamente',
    };
  } catch (error) {
    console.error('Error in sendOrderTransferInstructionsEmail:', error);

    return {
      ok: false,
      message: 'Error enviando email con instrucciones de transferencia',
    };
  }
}
