import { CartProduct } from "@/interfaces";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {
    cart: CartProduct[],
    getTotalItems: () => number;
    getSummaryInformation: () => {
        subTotal: number;
        tax: number;
        total: number;
        itemsInCart: number;
        discount: number;
    };
    addProductToCart: (product: CartProduct) => void;
    updateProductQuantity: (product: CartProduct, quantity: number) => void;
    removeProduct: (product: CartProduct) => void;
    isInCart: (variantId: string) => CartProduct | false;
    clearCart: () => void;
    getCart: () => CartProduct[];
    updateVariantPriceDiscount: (variantId: string, discountPercent: number|null) => void;
}

export const useCartStore = create<State>()(

    persist(
        (set, get) => ({

            cart: [],
    
    
            // Methods
            getTotalItems: () => {
                const {cart} = get()
                return cart.reduce((total, item) => total + item.quantity, 0)
            },

            getSummaryInformation: () => {
                const {cart} = get();

                const subTotal = cart.reduce( 
                    (subTotal, product) => 
                        (product.quantity * product.price) + subTotal
                    , 0)

                // const tax = subTotal * 0.21;
                const tax = 0; // TODO - Temporarily set to 0, adjust as needed
                
                const discount = cart.reduce(
                    (totalDiscount, product) => 
                        totalDiscount + (product.discountPercent ? (product.quantity * product.price * (product.discountPercent / 100)) : 0)
                    , 0)
                
                const total = subTotal + tax - discount;

                const itemsInCart = cart.reduce((total, item) => total + item.quantity, 0)


                return {
                    subTotal, tax, total, itemsInCart, discount
                }
            },

            addProductToCart: (product: CartProduct) => {
                const {cart} = get();
    
                const productInCart = cart.some(
                    (item) => (item.variantId === product.variantId)
                )
    
                if(!productInCart){
                    set({cart: [...cart, product]})
                    return
                }
    
                const updatedCartProducts = cart.map((item) => {
                    if(item.variantId === product.variantId){
                        return {...item, quantity: item.quantity + product.quantity }
                    }
    
                    return item
                })
    
                set({cart: updatedCartProducts})
            },

            

            updateProductQuantity: (product: CartProduct, quantity: number) => {
                
                const {cart} = get();
                console.log('actualizando cantidad');
                
                const updatedCartProducts = cart.map(
                    (item) => {
                        if(item.variantId === product.variantId){
                            return {...item, quantity: quantity}
                        }
                        return item
                    }
                )
    
                set({cart: updatedCartProducts})
            },

            removeProduct: (product: CartProduct) => {
                const {cart} = get()
                const updatedCartProducts = cart.filter(
                    (item) => item.variantId !== product.variantId
                )

                set({cart: updatedCartProducts})

            },

            isInCart: (variantId: string) => {
                const {cart} = get()
                const variant = cart.find((item) => item.variantId === variantId)
                if(!variant) return false;
                return variant
            },

            clearCart: () => {
                set({cart: []})
            },

            getCart: () => {
                return get().cart
            },
            updateVariantPriceDiscount: (variantId: string, discountPercent: number|null) => {
                const {cart} = get();
                const updatedCartProducts = cart.map((item) => {
                    if(item.variantId === variantId){
                        return {...item,  discountPercent }
                    }
                    return item;
                });
                set({cart: updatedCartProducts});
            }
        
        })
        ,
        {
            name: 'shopping-cart',
        }
    )
)