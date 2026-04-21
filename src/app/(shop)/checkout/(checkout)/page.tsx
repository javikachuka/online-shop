import { Title } from "@/components";
import Link from "next/link";
import { ProductsInCart } from "./ui/ProductsInCart";
import { PlaceOrder } from "./ui/PlaceOrder";
import { getDefaultCompany, getPaymentsMethods } from "@/actions";
import { DEFAULT_SHIPPING_CONFIG } from "@/lib/shipping-utils";


export default async function CategoryPage() {

    const paymentsMethods = await getPaymentsMethods();
    const defaultCompany = await getDefaultCompany();

    const shippingConfig = {
        standardCost: defaultCompany?.deliveryBaseCost ?? DEFAULT_SHIPPING_CONFIG.standardCost,
        freeShippingThreshold: defaultCompany?.freeShippingThreshold ?? DEFAULT_SHIPPING_CONFIG.freeShippingThreshold,
        expressCost: defaultCompany?.expressShippingCost ?? DEFAULT_SHIPPING_CONFIG.expressCost
    };
    
    
    return (
        <div className="flex justify-center items-center mb-72 px-4 sm:px-0">
            <div className="flex flex-col w-[1000px]">
                <Title title="Verificar pedido"></Title>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-10">
                    {/* Carrito */}
                    <div className="flex flex-col mt-5">
                        <span className="text-xl">Editar items</span>
                        <Link href={"/cart"} className="underline mb-5">
                            Editar
                        </Link>

                        {/* Items */}
                        <ProductsInCart />
                    </div>

                    {/* Checkout */}
                    <PlaceOrder paymentsMethods={paymentsMethods} shippingConfig={shippingConfig} />
                </div>
            </div>
        </div>
    );
}
