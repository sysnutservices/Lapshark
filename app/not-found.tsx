import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center text-slate-400 gap-4 my-16">
            <Image src="https://ik.imagekit.io/ayiw6a4pw/lapshark/gallery/_Pngtree_error%20404%20page%20not%20found_6681621.png" alt="404" width={400} height={400} className="rounded-lg" />

            <p className="text-slate-500">The page you are looking for does not exist or has been moved.</p>
            <Link href="/" className="text-teal-500 hover:underline">
                Return Home
            </Link>
        </div>
    )
}
