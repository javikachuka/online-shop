'use server'

import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { applyStockChange } from '@/lib/stock-movements';
import { StockMovementType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export const getPaginatedStockVariants = async (
  page: number = 1,
  take: number = 20,
  search: string = ''
) => {
  if (isNaN(Number(page)) || page < 1) page = 1;
  if (isNaN(Number(take)) || take < 1) take = 20;

  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;

  if (!userId) {
    return {
      ok: false,
      error: 'User not authenticated',
      variants: [],
      movements: [],
      totalPages: 0,
      currentPage: page,
    };
  }

  if (role !== 'admin') {
    return {
      ok: false,
      error: 'No autorizado',
      variants: [],
      movements: [],
      totalPages: 0,
      currentPage: page,
    };
  }

  try {
    const trimmedSearch = search.trim();

    const whereClause = trimmedSearch
      ? {
          OR: [
            { sku: { contains: trimmedSearch, mode: 'insensitive' as const } },
            { product: { title: { contains: trimmedSearch, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [variants, totalCount, movements] = await Promise.all([
      prisma.productVariant.findMany({
        where: whereClause,
        skip: (page - 1) * take,
        take,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          sku: true,
          stock: true,
          price: true,
          updatedAt: true,
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      prisma.productVariant.count({ where: whereClause }),
      prisma.stockMovement.findMany({
        take: 40,
        orderBy: { createdAt: 'desc' },
        include: {
          variant: {
            select: {
              sku: true,
              product: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
          actorUser: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      ok: true,
      variants,
      movements,
      totalPages: Math.max(1, Math.ceil(totalCount / take)),
      currentPage: page,
      totalCount,
    };
  } catch (error) {
    console.error('Error retrieving stock admin data:', error);
    return {
      ok: false,
      error: 'No se pudieron recuperar los datos de stock',
      variants: [],
      movements: [],
      totalPages: 0,
      currentPage: page,
    };
  }
};

interface CreateStockMovementInput {
  variantId: string;
  quantity: number;
  movementType: 'RESTOCK' | 'ADJUSTMENT';
  reason?: string;
}

export const createAdminStockMovement = async (input: CreateStockMovementInput) => {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;

  if (!userId) {
    return { ok: false, error: 'User not authenticated' };
  }

  if (role !== 'admin') {
    return { ok: false, error: 'No autorizado' };
  }

  const variantId = input.variantId?.trim();
  const reason = input.reason?.trim();

  if (!variantId) {
    return { ok: false, error: 'variantId requerido' };
  }

  if (!Number.isFinite(input.quantity) || input.quantity === 0) {
    return { ok: false, error: 'La cantidad debe ser distinta de 0' };
  }

  if (input.movementType === 'RESTOCK' && input.quantity < 0) {
    return { ok: false, error: 'RESTOCK debe ser una cantidad positiva' };
  }

  try {
    const updatedVariant = await prisma.$transaction(async (tx) => {
      const movementType =
        input.movementType === 'RESTOCK' ? StockMovementType.RESTOCK : StockMovementType.ADJUSTMENT;

      return applyStockChange({
        tx,
        variantId,
        type: movementType,
        quantityDelta: input.quantity,
        reason: reason || undefined,
        actorUserId: userId,
      });
    });

    revalidatePath('/admin/stock');
    revalidatePath('/admin/products');

    return {
      ok: true,
      message: 'Movimiento registrado correctamente',
      variant: {
        id: updatedVariant.id,
        stock: updatedVariant.stock,
      },
    };
  } catch (error: any) {
    console.error('Error creating admin stock movement:', error);
    return {
      ok: false,
      error: error?.message || 'No se pudo registrar el movimiento',
    };
  }
};
