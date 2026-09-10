export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-burnished-gold focus:px-4 focus:py-2 focus:text-on-primary"
    >
      {label}
    </a>
  )
}
