import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import {prisma} from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { ok: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { orderId } = params;

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: session.user.id
            },
            select: {
                id: true,
                orderStatus: true,
                total: true,
                createdAt: true,
                reservationExpiresAt: true,
                isPaid: true,
                paymentStatus: true
            }
        });

        if (!order) {
            return NextResponse.json(
                { ok: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ok: true,
            order: {
                ...order,
                createdAt: order.createdAt.toISOString(),
                reservationExpiresAt: order.reservationExpiresAt?.toISOString()
            }
        });

    } catch (error: any) {
        console.error('Error fetching order status:', error);
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}