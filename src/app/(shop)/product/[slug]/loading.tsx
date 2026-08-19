// Esqueleto propio de la PDP: imita la grilla galería + info de ProductDetailContent (evita CLS)
export default function Loading() {
  return (
    <div className="md:mt-5 mb-20 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-7xl mx-auto">
      <div className="col-span-1 md:col-span-2">
        <div className="w-full aspect-square md:aspect-[4/3] rounded bg-gray-200 animate-pulse" />
        <div className="mt-3 flex gap-2 max-md:px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 w-16 rounded bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="col-span-1 px-5">
        <div className="h-7 w-3/4 rounded bg-gray-200 animate-pulse" />

        <div className="mt-4 h-6 w-1/3 rounded bg-gray-200 animate-pulse" />

        <div className="mt-6 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-14 rounded bg-gray-200 animate-pulse" />
          ))}
        </div>

        <div className="mt-6 h-10 w-full rounded bg-gray-200 animate-pulse" />

        <div className="mt-4 h-4 w-24 rounded bg-gray-200 animate-pulse" />

        <div className="mt-6 h-4 w-28 rounded bg-gray-200 animate-pulse" />
        <div className="mt-2 space-y-2">
          <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
