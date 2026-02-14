import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";
import { getUserPermissions } from "@/lib/permissions";
import AdminShell from "@/components/admin/AdminShell";
import PermissionsProvider from "@/components/admin/PermissionsProvider";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect(`/${locale}/handler/sign-in?after_auth_return_to=/${locale}/admin`);
  }

  const permissions = await getUserPermissions(user.id);

  return (
    <PermissionsProvider permissions={permissions}>
      <AdminShell>{children}</AdminShell>
    </PermissionsProvider>
  );
}
