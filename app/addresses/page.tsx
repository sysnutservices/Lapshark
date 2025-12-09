import { Metadata } from 'next';
import { AddressBook } from './AddressesContent';

export const metadata: Metadata = {
    title: 'My Addresses | LapShark',
    description: 'Manage your shipping addresses.',
};

export default function AddressesPage() {
    return <AddressBook />;
}
