'use server';

import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const setProductEnabled = async (productId: string, isEnabled: boolean) => {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      error: 'Usuario no autenticado',
    };
  }

  if (session.user.role !== 'admin') {
    return {
      ok: false as const,
      error: 'No autorizado para modificar productos',
    };
  }

  if (!productId) {
    return {
      ok: false as const,
      error: 'ID de producto inválido',
    };
  }

  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { isEnabled },
      select: { id: true, isEnabled: true, slug: true },
    });

    revalidatePath('/admin/products');
    revalidatePath('/');
    revalidatePath(`/product/${product.slug}`);

    return {
      ok: true as const,
      product,
      message: isEnabled ? 'Producto habilitado' : 'Producto eliminado lógicamente',
    };
  } catch (error) {
    console.error('Error updating product enabled status:', error);
    return {
      ok: false as const,
      error: 'No se pudo actualizar el estado del producto',
    };
  }
};
