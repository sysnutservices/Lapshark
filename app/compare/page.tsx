import { Metadata } from 'next';
import CompareContent from './CompareContent';

export const metadata: Metadata = {
    title: 'Compare Products | LapShark',
    description: 'Compare features and prices of your favorite laptops.',
};

export default function ComparePage() {
    return <CompareContent />;
}
