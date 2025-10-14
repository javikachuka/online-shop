'use server'

import { Address } from "@/interfaces";
import prisma from "@/lib/prisma";


export const setUserAddress = async (address: Address, userId: string) => {
    try {

        const savedAddress = await createOrReplaceAddress(address, userId)

        return {
            ok: true,
            address: savedAddress
        }
        
    } catch (error) {
        console.log(error);

        return {
            ok: false,
            message: 'no se pudo crear la direccion'
        }
        
    }
}


const createOrReplaceAddress = async (address: Address, userId: string) => {

    try {

        const storedAddress = await prisma.userAddress.findUnique({
            where:{userId}
        })

        const addressToSave = {
            userId: userId,
            address: address.address,
            address2: address.address2,
            countryId: address.country,
            firstName: address.firstName,
            lastName: address.lastName,
            postalCode: address.postalCode,
            phone: address.phone,
            city: address.city
        }

        if(!storedAddress){
            const newAddress = await prisma.userAddress.create({
                data: addressToSave
            })

            return newAddress
        }

        const updatedAddress = await prisma.userAddress.update({
            where: {
                userId
            },
            data: addressToSave
        })

        return updatedAddress


    } catch (error) {
        console.log(error);
        throw new Error('No se pudo grabar la direccion')
    }


}

