export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-16 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-600 rounded flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
                <path d="M2.5 12.5V7L7.5 2L12.5 7V12.5H9.5V9H5.5V12.5H2.5Z" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">FileForge</span>
            <span className="text-xs text-neutral-400">© 2024</span>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            🔒 Files processed locally — never stored on our servers
          </p>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <a href="#" className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">Privacy</a>
            <a href="#" className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">Terms</a>
            <a href="#" className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
