import { Metadata } from 'next';
import OrderSuccessContent from './OrderSuccessContent';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Order #${id} Confirmed | LapShark`,
        description: 'Thank you for your purchase!',
    };
}

export default async function OrderSuccessPage({ params }: Props) {
    const { id } = await params;
    return <OrderSuccessContent id={id} />;
}
