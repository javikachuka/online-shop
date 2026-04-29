'use server'

import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email";
import bcryptjs from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
    firstName: z.string().trim().min(1, 'El nombre es obligatorio'),
    lastName: z.string().trim().min(1, 'El apellido es obligatorio'),
    email: z.string().trim().email('Email invalido'),
    password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
    phone: z.string().optional(),
    birthDate: z.string().optional(),
    gender: z.string().optional(),
    acceptMarketing: z.boolean().optional()
});


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
        const parsedData = registerSchema.safeParse({
            firstName,
            lastName,
            email,
            password,
            phone,
            birthDate,
            gender,
            acceptMarketing
        });

        if (!parsedData.success) {
            return {
                ok: false,
                message: parsedData.error.issues[0]?.message || 'Datos de registro invalidos'
            };
        }

        const validatedData = parsedData.data;

        const user = await prisma.user.create({
            data: {
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                email: validatedData.email.toLowerCase(),
                password: bcryptjs.hashSync(validatedData.password),
                phone: validatedData.phone || null,
                birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
                gender: validatedData.gender || null,
                acceptedTerms: true, // Si llega aquí es porque aceptó los términos
                acceptMarketing: validatedData.acceptMarketing || false
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

        try {
            const emailService = EmailService.getInstance();
            await emailService.sendWelcomeEmail(
                user.email,
                `${user.firstName} ${user.lastName}`.trim()
            );
        } catch (emailError) {
            console.error('Error enviando email de bienvenida:', emailError);
        }

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