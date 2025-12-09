import ShopClient from "./ProductsClient";

export default async function Shop({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>
}) {
    const params = await searchParams;
    const categoryParam = params.category ?? "All";

    return (
        <ShopClient initialCategory={categoryParam} />
    );
}
