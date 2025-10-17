import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Simple in-memory store (se reinicia si reinicias el servidor)
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const WINDOW_SIZE = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 150; // Máximo 10 requests por IP por minuto

export async function POST(request: Request) {
  // Obtén la IP del usuario
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // Rate limiting
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, lastRequest: now };
  if (now - entry.lastRequest > WINDOW_SIZE) {
    // Reinicia la ventana
    entry.count = 1;
    entry.lastRequest = now;
  } else {
    entry.count += 1;
  }
  rateLimitMap.set(ip, entry);

  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes, intenta más tarde." },
      { status: 429 }
    );
  }

  // Lógica de stock considerando reservas activas
  try {
    const { variantIds } = await request.json();
    if (!Array.isArray(variantIds) || !variantIds.every(id => typeof id === "string")) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Obtener variantes con su stock base
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, stock: true, discountPercent: true, price: true },
    });

    // Calcular stock real considerando reservas activas
    const variantsWithRealStock = await Promise.all(
      variants.map(async (variant) => {
        // Obtener total de stock reservado activo para esta variante
        const activeReservations = await prisma.stockReservation.aggregate({
          where: {
            variantId: variant.id,
            status: 'ACTIVE',
            expiresAt: { gt: new Date() } // Solo reservas no expiradas
          },
          _sum: { quantity: true }
        });

        const reservedStock = activeReservations._sum.quantity || 0;
        const availableStock = Math.max(0, variant.stock - reservedStock); // No puede ser negativo

        return {
          id: variant.id,
          stock: availableStock, // Stock real disponible
          discountPercent: variant.discountPercent,
          price: variant.price,
          // Información adicional para debugging (opcional)
          _debug: {
            totalStock: variant.stock,
            reservedStock: reservedStock,
            availableStock: availableStock
          }
        };
      })
    );

    // Remover información de debug en producción
    const cleanVariants = variantsWithRealStock.map(({ _debug, ...variant }) => variant);
    
    return NextResponse.json(cleanVariants);
  } catch (error) {
    console.error('Error obteniendo stock por variante:', error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}