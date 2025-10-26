// Agregar a todas las páginas de admin que usen headers
export const dynamic = 'force-dynamic';
// O alternativamente:
export const revalidate = 0;
export default function AdminPage() {
  return (
    <div>
      <h1>Hello Admin Page</h1>
    </div>
  );
}