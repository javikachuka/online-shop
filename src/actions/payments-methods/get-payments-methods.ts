'use server'

import prisma from "@/lib/prisma";


export const getPaymentsMethods = async () => {
    try {

        const paymentsMethods = await prisma.paymentMethod.findMany({
            where: {isEnabled: true},
            orderBy: {
                order: 'asc'
            }
        })

        return paymentsMethods
        
    } catch (error) {
        console.log(error);
        return []
    }
}