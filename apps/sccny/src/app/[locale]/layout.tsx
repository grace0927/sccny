import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { stackClientApp } from "../../stack/client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "施福基督教会 Suffolk Christian Church",
  description: "Suffolk Christian Church - A church serving the community",
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!["en", "zh"].includes(locale || "")) {
    notFound();
  }

  let messages;
  try {
    messages = await getMessages({ locale });
  } catch (error) {
    console.error("Error loading messages:", error);
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StackProvider app={stackClientApp}>
            <StackTheme>{children}</StackTheme>
          </StackProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
