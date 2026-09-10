// src/app/[lang]/layout.tsx  (temporary root layout — replaced in Task 6)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
