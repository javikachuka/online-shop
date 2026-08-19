'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es-AR">
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <h2>Algo salió mal</h2>
          <p>Ocurrió un problema inesperado. Por favor, recargá la página.</p>
          <button onClick={() => reset()}>Reintentar</button>
        </div>
      </body>
    </html>
  )
}
