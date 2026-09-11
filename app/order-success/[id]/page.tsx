import { Metadata } from 'next';
import OrderSuccessContent from './OrderSuccessContent';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return {
        // Root layout's title template already appends " | Lapshark" — this
        // was rendering "Order #... Confirmed | LapShark | Lapshark" right
        // after a customer completes checkout.
        title: `Order #${id} Confirmed`,
        description: 'Thank you for your purchase!',
        robots: { index: false, follow: false },
    };
}

export default async function OrderSuccessPage({ params }: Props) {
    const { id } = await params;
    return <OrderSuccessContent id={id} />;
}
