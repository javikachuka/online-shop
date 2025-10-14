"use client"

import { login, registerUser } from "@/actions";
import Link from "next/link";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type FormInputs = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
    acceptTerms: boolean;
    acceptMarketing?: boolean;
}

export const RegisterForm = () => {

    const [errorMessage, setErrorMessage] = useState('')

    const { register, handleSubmit, formState: {errors} } = useForm<FormInputs>()

    const onSubmit: SubmitHandler<FormInputs> = async(data) => {
        setErrorMessage('')
        const {firstName, lastName, email, password, phone, birthDate, gender, acceptMarketing} = data

        const resp = await registerUser(firstName, lastName, email, password, phone, birthDate, gender, acceptMarketing)

        if(!resp.ok){
            setErrorMessage(resp.message)
            return
        }

        await login(email.toLowerCase(), password)

        window.location.replace('/')
        

    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            
            {/* Campos de nombre separados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                    <label htmlFor="firstName">Nombre <span className="text-red-500">*</span></label>
                    <input
                        className={`px-5 py-2 border bg-gray-200 rounded w-full ${errors.firstName ? 'border-red-500' : ''}`}
                        type="text"
                        autoFocus
                        placeholder="Juan"
                        {...register("firstName", {required: "El nombre es obligatorio"})}
                    />
                    {errors.firstName && (
                        <span className="text-red-500 text-sm">{errors.firstName.message}</span>
                    )}
                </div>
                
                <div>
                    <label htmlFor="lastName">Apellido <span className="text-red-500">*</span></label>
                    <input
                        className={`px-5 py-2 border bg-gray-200 rounded w-full ${errors.lastName ? 'border-red-500' : ''}`}
                        type="text"
                        placeholder="Pérez"
                        {...register("lastName", {required: "El apellido es obligatorio"})}
                    />
                    {errors.lastName && (
                        <span className="text-red-500 text-sm">{errors.lastName.message}</span>
                    )}
                </div>
            </div>
            
            <label htmlFor="email">Correo electrónico <span className="text-red-500">*</span></label>
            <input
                className={`px-5 py-2 border bg-gray-200 rounded mb-5 ${errors.email ? 'border-red-500' : '' }`}
                type="email"
                {...register('email', {required: true})}
            />

            <label htmlFor="password">Contraseña <span className="text-red-500">*</span></label>
            <input
                className={`px-5 py-2 border bg-gray-200 rounded mb-5 ${errors.password ? 'border-red-500' : '' }`}
                type="password"
                {...register('password', {required: true, minLength: 8})}
            />

            {/* Campos adicionales opcionales */}
            <div className="mb-5">
                <label htmlFor="phone">Teléfono</label>
                <input
                    className="px-5 py-2 border bg-gray-200 rounded w-full mb-5"
                    type="tel"
                    placeholder="376 4568899"
                    {...register('phone')}
                />
                
                <label htmlFor="gender">Género</label>
                <select
                    className="px-5 py-2 border bg-gray-200 rounded w-full"
                    {...register('gender')}
                >
                    <option value="">Seleccionar...</option>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                    <option value="prefer-not-to-say">Prefiero no decir</option>
                </select>
            </div>

            <div className="mb-5">
                <label htmlFor="birthDate">Fecha de nacimiento</label>
                <input
                    className="px-5 py-2 border bg-gray-200 rounded w-full"
                    type="date"
                    max={new Date(new Date().getFullYear() - 13, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                    {...register('birthDate')}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Nos ayuda a personalizar tu experiencia y ofertas especiales
                </p>
            </div>

            {/* Checkboxes de términos y marketing */}
            <div className="mb-5 space-y-3">
                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        id="acceptTerms"
                        className={`mt-1 ${errors.acceptTerms ? 'border-red-500' : ''}`}
                        {...register('acceptTerms', {required: true})}
                    />
                    <label htmlFor="acceptTerms" className="text-sm">
                        Acepto los{' '}
                        <Link href="/terms" className="text-blue-600 hover:underline" target="_blank">
                            Términos y Condiciones
                        </Link>{' '}
                        y la{' '}
                        <Link href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                            Política de Privacidad
                        </Link>{' '}
                        <span className="text-red-500">*</span>
                    </label>
                </div>
                
                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        id="acceptMarketing"
                        {...register('acceptMarketing')}
                    />
                    <label htmlFor="acceptMarketing" className="text-sm text-gray-600">
                        Quiero recibir ofertas especiales, descuentos y noticias por email
                    </label>
                </div>
            </div>

            {errors.acceptTerms && (
                <span className="text-red-500 text-sm mb-3 block">
                    Debes aceptar los términos y condiciones para continuar
                </span>
            )}


            <span className="text-red-500">{errorMessage}</span>

            <button className="btn-primary">Crear cuenta</button>

            {/* divisor l ine */}
            <div className="flex items-center my-5">
                <div className="flex-1 border-t border-gray-500"></div>
                <div className="px-2 text-gray-800">O</div>
                <div className="flex-1 border-t border-gray-500"></div>
            </div>

            <Link href="/auth/login" className="btn-secondary text-center">
                Ingresar
            </Link>
        </form>
    );
};
