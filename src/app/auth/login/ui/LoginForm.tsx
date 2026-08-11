"use client";
import { authenticate, authenticateWithGoogle } from "@/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { IoInformationOutline } from "react-icons/io5";
import { useActionState, useEffect } from "react";

const LoginForm = () => {
    const searchParams = useSearchParams();
    const rawRedirectTo = searchParams.get("redirectTo") || "/";
    const redirectTo = rawRedirectTo.startsWith("/") && !rawRedirectTo.startsWith("//")
        ? rawRedirectTo
        : "/";
    const [state, formAction] = useActionState(authenticate, undefined);

    useEffect(() => {
        if(state === "Success"){
            window.location.replace(redirectTo);
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
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <GoogleLoginButton />

            {state === "error" && (
                <div className="flex h-8 items-end space-x-1 mb-5 mt-4">
                    <IoInformationOutline className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-500">El usuario o la contraseña son incorrectos</p>
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

const GoogleLoginButton = () => {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            formAction={authenticateWithGoogle}
            className={`mt-3 flex h-11 items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${pending ? "cursor-not-allowed opacity-70" : "hover:bg-gray-50"}`}
            disabled={pending}
        >
            <GoogleIcon />
            <span>Continuar con Google</span>
        </button>
    );
};

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
        <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.72-1.58 2.68-3.92 2.68-6.62Z"
        />
        <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 0 0 9 18Z"
        />
        <path
            fill="#FBBC05"
            d="M3.97 10.71A5.4 5.4 0 0 1 3.69 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
        />
        <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.46 3.43 1.36l2.57-2.57C13.47.95 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        />
    </svg>
);
 