// Esqueleto de /checkout/address: imita título + formulario de dirección (evita CLS)
export default function Loading() {
  return (
    <div className="flex flex-col sm:justify-center sm:items-center mb-72 px-4 sm:px-0">
      <div className="w-full xl:w-[1000px] flex flex-col justify-center text-left">
        <div className="mt-3">
          <div className="h-10 w-40 my-6 rounded bg-gray-200 animate-pulse" />
          <div className="h-5 w-64 mb-10 rounded bg-gray-200 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
              <div className="h-10 w-full rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="mt-5 h-11 w-40 rounded bg-gray-300 animate-pulse" />
      </div>
    </div>
  );
}
