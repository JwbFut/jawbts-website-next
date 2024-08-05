import "@/app/global.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" style={{ backgroundColor: "#222222" }}>
      <body className="overflow-x-clip">
        {children}
      </body>
    </html>
  );
}