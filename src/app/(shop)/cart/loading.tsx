// Esqueleto de /cart: imita título + columna de items + resumen de pedido (evita CLS)
export default function Loading() {
  return (
    <div className="flex justify-center items-center mb-72 px-4 sm:px-0">
      <div className="flex flex-col w-[1000px]">
        <div className="mt-3 max-md:px-4">
          <div className="h-10 w-40 my-6 rounded bg-gray-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {/* Carrito */}
          <div className="flex flex-col mt-5">
            <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 mt-2 mb-5 rounded bg-gray-200 animate-pulse" />

            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-24 w-24 shrink-0 rounded bg-gray-200 animate-pulse" />
                  <div className="flex flex-col justify-center gap-2 w-full">
                    <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
                    <div className="h-4 w-1/3 rounded bg-gray-200 animate-pulse" />
                    <div className="h-8 w-24 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout */}
          <div className="bg-white rounded-xl shadow-xl p-7 h-fit">
            <div className="h-7 w-48 mb-4 rounded bg-gray-200 animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="mt-5 mb-2 w-full h-11 rounded bg-gray-300 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
