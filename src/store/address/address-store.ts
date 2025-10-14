import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {

    address: {
        firstName: string;
        lastName: string;
        address: string;
        address2?: string;
        postalCode: string;
        city: string;
        country: string;
        phone: string;
        rememberAddress?: boolean;
        deliveryMethod?: 'delivery' | 'pickup';
    }

    //methods

    setAddress: (address: State['address']) => void
    getAddress: () => State['address']

}

export const useAddressStore = create<State>()(

    persist(
        (set, get) => ({
            address: {
                firstName: '',
                lastName: '',
                address: '',
                address2: '',
                postalCode: '',
                city: '',
                country: '',
                phone: '',
                deliveryMethod: 'delivery'
            },
            setAddress: (address) => {
                set({address})
            },
            getAddress: () => {
                const {address} = get()

                return address
            }
        }),
        {
            name: 'address-storage'
        }
    )

    
)