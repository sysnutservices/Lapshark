import { Metadata } from 'next';
import { Account } from './AccountContent';
export const metadata: Metadata = {
    title: 'My Account | LapShark',
    description: 'Manage your profile, orders, and settings.',
    robots: { index: false, follow: false },
};

export default function AccountPage() {
    return <Account />;
}
