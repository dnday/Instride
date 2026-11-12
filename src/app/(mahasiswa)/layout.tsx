import type { ReactNode } from "react";

import { StudentNav } from "@/components/StudentShell";

// Navigasi dirender sekali untuk semua halaman mahasiswa, jadi tetap terpasang saat pindah halaman
// (penanda menu aktif bisa meluncur antar-tab dan halaman tidak berkedip).
export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <StudentNav />
      {children}
    </div>
  );
}
