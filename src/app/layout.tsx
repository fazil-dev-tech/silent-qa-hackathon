import './globals.css'

export const metadata = {
  title: 'Silent Backend QA — Automated Defect Enhancement',
  description: 'AI-powered defect report enhancement system that combines browser extension monitoring with human QA expertise',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
