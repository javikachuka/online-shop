import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    not_found: string[];
  }>;
}

export default async function ShopCatchAllNotFoundPage({ params }: Props) {
  await params;
  notFound();
}
