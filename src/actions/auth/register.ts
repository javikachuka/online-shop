'use server'

import {prisma} from "@/lib/prisma";
import bcryptjs from 'bcryptjs';


export const registerUser = async (
    firstName: string,
    lastName: string, 
    email: string, 
    password: string, 
    phone?: string, 
    birthDate?: string, 
    gender?: string,
    acceptMarketing?: boolean
) => {

    try {

        const user = await prisma.user.create({
            data: {
                firstName: firstName,
                lastName: lastName,
                email: email.toLowerCase(),
                password: bcryptjs.hashSync(password),
                phone: phone || null,
                birthDate: birthDate ? new Date(birthDate) : null,
                gender: gender || null,
                acceptedTerms: true, // Si llega aquí es porque aceptó los términos
                acceptMarketing: acceptMarketing || false
            },
            select:{
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                gender: true,
                createdAt: true
            }
        })

        return {
            ok: true,
            user: user,
            message: 'Usuario creado exitosamente'
        }
        
    } catch (error) {
        console.log(error);

        return {
            ok: false,
            message: 'No se pudo crear el usuario'
        }
        
    }

}