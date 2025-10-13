import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
      <div className="text-lg font-semibold tracking-tight">
   <a href="/">josiah.fun</a> 
   </div>

      <ul className="flex gap-6 text-sm font-medium">
        <li>
          <Link href="/wordimposter" className="hover:text-blue-600 transition-colors">
           Word Imposter 
          </Link>
        </li>
        <li>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">
            Contact
          </Link>
        </li>
      </ul>
    </nav>
  );
}
