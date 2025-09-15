// app/admin/layout.tsx

// Hapus semua impor yang berhubungan dengan ProtectedRoute atau Suspense

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Langsung return children tanpa pembungkus
  return <>{children}</>;
}