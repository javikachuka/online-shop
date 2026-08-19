// Esqueleto con las mismas dimensiones que el contenido real para evitar CLS al hidratar
export default function Loading() {
  return (
    <>
      <div className="mt-3 max-md:px-4">
        <div className="h-10 w-64 my-6 rounded bg-gray-200 animate-pulse" />
        <div className="h-6 w-80 mb-10 rounded bg-gray-200 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 max-md:px-4 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-10">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-md overflow-hidden">
            <div className="w-full aspect-square sm:aspect-[4/5] lg:aspect-[15/16] rounded bg-gray-200 animate-pulse" />
            <div className="pt-2 md:p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse mb-2" />
              <div className="h-4 w-1/3 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
