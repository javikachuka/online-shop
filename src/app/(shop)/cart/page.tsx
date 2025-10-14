import { Title } from "@/components";
import Link from "next/link";
import { ProductsInCart } from "./ui/ProductsInCart";
import { OrderSummary } from "./ui/OrderSummary";



export default function CategoryPage() {


    return (
        <div className="flex justify-center items-center mb-72 px-4 sm:px-0">
            <div className="flex flex-col w-[1000px]">
                <Title title="Carrito"></Title>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    {/* Carrito */}
                    <div className="flex flex-col mt-5">
                        <span className="text-xl">Agregar mas items</span>
                        <Link href={"/"} className="underline mb-5">
                            Continua comprando
                        </Link>

                        {/* Items */}
                        <ProductsInCart />
                    </div>

                    {/* Checkout */}
                    <div className=" bg-white rounded-xl shadow-xl p-7 h-fit">
                      <h2 className="text-2xl mb-2">Resumen de pedido</h2>
                      <OrderSummary />

                      <div className="mt-5 mb-2 w-full">
                        <Link
                          className="flex btn-primary justify-center"
                          href={'/checkout/address'}
                        >
                          Continuar
                        </Link>
                      </div>

                    </div>
                    
                    

                </div>
            </div>
        </div>
    );
}
