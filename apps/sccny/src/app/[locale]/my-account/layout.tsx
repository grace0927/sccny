import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";

export default async function MyAccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect(`/handler/sign-in?after_auth_return_to=/${locale}/my-account`);
  }

  return <>{children}</>;
}
