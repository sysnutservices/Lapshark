import { Metadata } from 'next';
import WishlistContent from './WishlistContent';

export const metadata: Metadata = {
    title: 'My Wishlist | LapShark',
    description: 'View and manage your saved products.',
};

export default function WishlistPage() {
    return <WishlistContent />;
}
