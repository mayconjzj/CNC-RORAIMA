import type { Metadata } from "next";
import { AdminRouteGuard } from "@/components/admin/admin-route-guard";

export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
