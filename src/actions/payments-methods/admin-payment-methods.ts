'use server'

import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface PaymentMethodPayload {
  id?: string;
  name: string;
  description?: string | null;
  type?: string | null;
  discountPercent?: number | null;
  order?: number | null;
  isEnabled?: boolean;
}

const ensureAdmin = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false as const, error: 'Usuario no autenticado' };
  }

  if (session.user.role !== 'admin') {
    return { ok: false as const, error: 'No autorizado para administrar métodos de pago' };
  }

  return { ok: true as const };
};

export const getAdminPaymentMethods = async () => {
  const authResult = await ensureAdmin();
  if (!authResult.ok) {
    return {
      ok: false,
      error: authResult.error,
      paymentMethods: []
    };
  }

  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });

    return {
      ok: true,
      paymentMethods
    };
  } catch (error) {
    console.error('Error loading admin payment methods:', error);
    return {
      ok: false,
      error: 'No se pudieron recuperar los métodos de pago',
      paymentMethods: []
    };
  }
};

export const saveOrUpdatePaymentMethod = async (payload: PaymentMethodPayload) => {
  const authResult = await ensureAdmin();
  if (!authResult.ok) {
    return {
      ok: false,
      error: authResult.error
    };
  }

  const name = payload.name?.trim();
  if (!name) {
    return {
      ok: false,
      error: 'El nombre es obligatorio'
    };
  }

  const discountPercent =
    typeof payload.discountPercent === 'number' && !Number.isNaN(payload.discountPercent)
      ? payload.discountPercent
      : null;

  if (discountPercent !== null && (discountPercent < 0 || discountPercent > 100)) {
    return {
      ok: false,
      error: 'El descuento debe estar entre 0 y 100'
    };
  }

  const order =
    typeof payload.order === 'number' && Number.isFinite(payload.order)
      ? Math.trunc(payload.order)
      : null;

  try {
    const data = {
      name,
      description: payload.description?.trim() || null,
      type: payload.type?.trim() || null,
      discountPercent,
      order,
      isEnabled: payload.isEnabled ?? true,
    };

    const paymentMethod = payload.id
      ? await prisma.paymentMethod.update({
          where: { id: payload.id },
          data,
        })
      : await prisma.paymentMethod.create({
          data,
        });

    revalidatePath('/admin/payment-methods');
    revalidatePath('/checkout');
    revalidatePath('/orders');

    return {
      ok: true,
      paymentMethod,
      message: payload.id
        ? 'Método de pago actualizado con éxito'
        : 'Método de pago creado con éxito'
    };
  } catch (error) {
    console.error('Error saving payment method:', error);
    return {
      ok: false,
      error: 'No se pudo guardar el método de pago'
    };
  }
};

export const togglePaymentMethodStatus = async (id: string, isEnabled: boolean) => {
  const authResult = await ensureAdmin();
  if (!authResult.ok) {
    return {
      ok: false,
      error: authResult.error
    };
  }

  try {
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: { isEnabled }
    });

    revalidatePath('/admin/payment-methods');
    revalidatePath('/checkout');

    return {
      ok: true,
      paymentMethod,
      message: isEnabled
        ? 'Método de pago habilitado'
        : 'Método de pago deshabilitado'
    };
  } catch (error) {
    console.error('Error toggling payment method status:', error);
    return {
      ok: false,
      error: 'No se pudo actualizar el estado del método de pago'
    };
  }
};
