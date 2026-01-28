// https://tailwindcomponents.com/component/hoverable-table
// Agregar a todas las páginas de admin que usen headers
export const dynamic = 'force-dynamic';
// O alternativamente:
export const revalidate = 0;
import { redirect } from "next/navigation";

import {  getPaginatedCaterories } from "@/actions";
import { CategoriasAdminClient } from './ui/CategoriasAdminClient';

interface Props {
    searchParams: {
        page?: string;
    };
}

export default async function CategoriasPage({ searchParams }: Props) {
    const page = searchParams.page ? parseInt(searchParams.page) : 1;
    const { categories, totalPages, ok } = await getPaginatedCaterories(page);
    if (!ok) {
      redirect("/auth/login");
    }
    return <CategoriasAdminClient categories={categories || []} totalPages={totalPages || 1} />;
}
