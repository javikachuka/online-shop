'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold">Algo salió mal</h2>
      <p className="text-gray-600">
        Ocurrió un problema al cargar esta página. Por favor, intentá de nuevo en unos segundos.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-black px-4 py-2 text-white transition hover:bg-gray-800"
      >
        Reintentar
      </button>
    </div>
  )
}
