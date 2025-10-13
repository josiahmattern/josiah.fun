export default function Nav() {
  return (
    <nav className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
      <div className="text-lg font-semibold tracking-tight">
   <a href="/">josiah.fun</a> 
   </div>

      <ul className="flex gap-6 text-sm font-medium">
        <li>
          <a href="/wordimposter" className="hover:text-blue-600 transition-colors">
           Word Imposter 
          </a>
        </li>
        <li>
          <a href="/contact" className="hover:text-blue-600 transition-colors">
            Contact
          </a>
        </li>
      </ul>
    </nav>
  );
}
