"use client";
import { authenticate } from "@/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom"; // <-- CORRECTO
import { IoInformationOutline } from "react-icons/io5";
import { useEffect } from 'react';

const LoginForm = () => {
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") || "/";
    const [state, formAction] = useFormState(authenticate, undefined);

    useEffect(() => {
        if(state === "Success"){
            window.location.replace(redirectTo)
        }
    }, [state, redirectTo])

    return (
        <form action={formAction} className="flex flex-col">
            <label htmlFor="email">Correo electrónico</label>
            <input
                className="px-5 py-2 border bg-gray-200 rounded mb-5"
                name="email"
                type="email"
            />

            <label htmlFor="password">Contraseña</label>
            <input
                className="px-5 py-2 border bg-gray-200 rounded mb-2"
                name="password"
                type="password"
            />

            <div className="text-right mb-5">
                <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                >
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>

            <LoginButton />

            {state === "CredentialsSignin" && (
                <div className="flex h-8 items-end space-x-1 mb-5">
                    <IoInformationOutline className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-500">Las credenciales no son correctas</p>
                </div>
            )}

            <div className="flex items-center my-5">
                <div className="flex-1 border-t border-gray-500"></div>
                <div className="px-2 text-gray-800">O</div>
                <div className="flex-1 border-t border-gray-500"></div>
            </div>

            <Link
                href="/auth/new-account"
                className="btn-secondary text-center"
            >
                Crear una nueva cuenta
            </Link>
        </form>
    );
};

export default LoginForm;

const LoginButton = () => {
    const {pending} = useFormStatus()
    return ( 
        <button 
            type="submit" 
            className={`${pending ? 'btn-disabled' : 'btn-primary'}`}
            disabled={pending}
        >
            Ingresar
        </button>
    );
}
 