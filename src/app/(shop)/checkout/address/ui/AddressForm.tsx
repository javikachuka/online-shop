"use client";

import { setUserAddress } from "@/actions";
import { Address, Company, Country } from "@/interfaces";
import { useAddressStore } from "@/store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

type FormInputs = {
    firstName: string;
    lastName: string;
    address: string;
    address2?: string;
    postalCode: string;
    city: string;
    country: string;
    phone: string;
    rememberAddress: boolean;
    deliveryMethod: 'delivery' | 'pickup';
};

interface Props {
    countries: Country[]
    userStoredAddress?: Partial<Address>
    company?: Company | null;
}

export const AddressForm = ({countries, userStoredAddress = {}, company}: Props) => {

    const router = useRouter()

    const {
        handleSubmit,
        register,
        formState: { isValid },
        reset,
        control
    } = useForm<FormInputs>({
        defaultValues: {
            ...(userStoredAddress as any),
            rememberAddress: true,
            deliveryMethod: 'delivery'
        },
    });

    const deliveryMethod = useWatch({
        control,
        name: 'deliveryMethod'
    });

    const setAddress = useAddressStore(state => state.setAddress)
    const storeAddress = useAddressStore(state => state.getAddress())

    const {data: session} = useSession({
        required: true
    })

    const deliveryBaseCost = company?.deliveryBaseCost ?? 10000;
    const formattedDeliveryBaseCost = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: company?.currency || 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(deliveryBaseCost);

    useEffect(() => {

        if(storeAddress.firstName){
            storeAddress.rememberAddress = true
            reset(storeAddress)
        }
    }, [storeAddress, reset])

    const onSubmit = async (data: FormInputs) => {
        
        const {rememberAddress, deliveryMethod, ...restAddress} = data
        setAddress({...restAddress, deliveryMethod})

        if(rememberAddress){
           await setUserAddress(restAddress, session!.user.id)
        }

        router.push('/checkout')

    };

    return (
        <>
            {/* Selector de método de entrega */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">¿Cómo querés recibir tu pedido?</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Envío a domicilio */}
                    <label className={`border-2 p-4 rounded-lg cursor-pointer ${
                        deliveryMethod === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}>
                        <div className="flex items-center space-x-3">
                            <input 
                                type="radio" 
                                value="delivery"
                                {...register("deliveryMethod")}
                            />
                            <div>
                                <p className="font-semibold">🚚 Envío a domicilio</p>
                                <p className="text-sm text-gray-600">Costo: {formattedDeliveryBaseCost}</p>
                                <p className="text-xs text-gray-500">Recibilo en esta dirección</p>
                            </div>
                        </div>
                    </label>

                    {/* Retiro en local */}
                    <label className={`border-2 p-4 rounded-lg cursor-pointer ${
                        deliveryMethod === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}>
                        <div className="flex items-center space-x-3">
                            <input 
                                type="radio" 
                                value="pickup"
                                {...register("deliveryMethod")}
                            />
                            <div>
                                <p className="font-semibold">🏪 Retiro en local</p>
                                <p className="text-sm text-green-600 font-semibold">¡GRATIS!</p>
                                {
                                    company && company.legalAddress && (
                                        <p className="text-xs text-gray-500">{company.legalAddress}</p>
                                    )
                                }
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 gap-2 sm:gap-5 sm:grid-cols-2"
            >
                {/* Título contextual */}
                <div className="col-span-1 sm:col-span-2 mb-4">
                    <h3 className="text-lg font-semibold">
                        {deliveryMethod === 'delivery' ? 'Dirección de entrega y facturación' : 'Dirección de facturación'}
                    </h3>
                    {deliveryMethod === 'pickup' && (
                        <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800">
                            <p className="text-sm">
                                <strong>Nota:</strong> Esta dirección se usará únicamente para la facturación. 
                                El producto se retira en nuestro local.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col mb-2">
                <span>Nombres</span>
                <input
                    type="text"
                    className="p-2 border rounded-md bg-gray-200"
                    {...register("firstName", { required: true })}
                />
            </div>

            <div className="flex flex-col mb-2">
                <span>Apellidos</span>
                <input
                    type="text"
                    className="p-2 border rounded-md bg-gray-200"
                    {...register("lastName", { required: true })}
                />
            </div>

            <div className="flex flex-col mb-2">
                <span>Dirección</span>
                <input
                    type="text"
                    className="p-2 border rounded-md bg-gray-200"
                    {...register("address", { required: true })}
                />
            </div>

            <div className="flex flex-col mb-2">
                <span>Dirección 2 (opcional)</span>
                <input
                    type="text"
                    className="p-2 border rounded-md bg-gray-200"
                    {...register("address2")}
                />
            </div>

            <div className="flex flex-col mb-2">
                <span>Código postal</span>
                <input
                    type="text"
                    className="p-2 border rounded-md bg-gray-200"
                    {...register("postalCode", { required: true })}
                />
            </div>

            <div className="flex flex-col mb-2">
                <span>Ciudad</span>
                <input
                    type="text"
                    className="p-2 border rounded-md bg-gray-200"
                    {...register("city", { required: true })}
                />
            </div>

            <div className="flex flex-col mb-2">
                <span>País</span>
                <select
                    className="p-2 border rounded-md bg-gray-200"
                    {...register("country", { required: true })}
                >
                    <option value="">[ Seleccione ]</option>
                    {
                        countries.map( country => (
                            <option key={country.id} value={country.id}>{country.name}</option>
                        ))
                    }
                </select>
            </div>

            <div className="flex flex-col mb-2">
                <span>Teléfono</span>
                <input
                    type="text"
                    className="p-2 border rounded-md bg-gray-200"
                    {...register("phone", { required: true })}
                />
            </div>

            <div className="flex flex-col mb-2 sm:mt-1">
                <div className="inline-flex items-center mb-10">
                    <label
                        className="relative flex cursor-pointer items-center rounded-full p-3"
                        htmlFor="checkbox"
                        data-ripple-dark="true"
                    >
                        <input
                            type="checkbox"
                            className="border-gray-500 before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-blue-500 checked:bg-blue-500 checked:before:bg-blue-500 hover:before:opacity-10"
                            id="checkbox"
                            {...register("rememberAddress")}
                        />
                        <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="1"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                ></path>
                            </svg>
                        </div>
                    </label>
                    <span>Recordar dirección?</span>
                </div>
                <button
                    type="submit"
                    className={`${!isValid ? 'btn-disabled': 'btn-primary'} flex w-full sm:w-1/2 justify-center`}
                    disabled={!isValid}
                >
                    Siguiente
                </button>
            </div>
        </form>

        {/* Información del local - Solo si es retiro */}
        {deliveryMethod === 'pickup' && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">📍 Información para retiro</h4>
                <p><strong>Dirección:</strong> {company?.legalAddress}</p>
                <p><strong>Horarios:</strong> Lun-Vie 9:00-18:00, Sáb 9:00-13:00</p>
                <p><strong>Teléfono:</strong> {company?.phone}</p>
                <p className="text-sm text-gray-600 mt-2">
                    Te avisaremos cuando tu pedido esté listo para retirar.
                </p>
            </div>
        )}
        </>
    );
};
