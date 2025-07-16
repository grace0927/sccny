"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "HOME", href: "/" },
  {
    name: "ABOUT US",
    href: "/about",
    sublinks: [
      { name: "CONFESSION OF FAITH", href: "/about/confession-of-faith" },
      { name: "HISTORIC CREEDS", href: "/about/historic-creeds" },
      { name: "OUR VISION", href: "/about/vision" },
      { name: "MINISTRIES", href: "/about/ministries" },
    ],
  },
  { name: "MEETING TIMES", href: "/meeting-times" },
  {
    name: "MESSAGES",
    href: "/messages",
    sublinks: [
      { name: "SERMON RECORDINGS", href: "/messages/sermon-recordings" },
      { name: "SUNDAY SCHOOL", href: "/messages/sunday-school" },
      { name: "SPECIAL GATHERING", href: "/messages/special-gathering" },
      { name: "BAPTISM CLASS", href: "/messages/baptism-class" },
    ],
  },
  { name: "PASTORAL SEARCH", href: "/pastoral-search" },
  { name: "CONTACT US", href: "/contact" },
];

const ListItem = ({
  title,
  href,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string; title: string }) => {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          )}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          {children && (
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          )}
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

export default function Navigation() {
  const t = useTranslations("Navigation");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-foreground">
              SCC
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <NavigationMenu>
              <NavigationMenuList>
                {navigation.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    {item.sublinks ? (
                      <>
                        <NavigationMenuTrigger>
                          {t(item.name)}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                            {item.sublinks.map((sublink) => (
                              <ListItem
                                key={sublink.name}
                                title={t(sublink.name)}
                                href={sublink.href}
                              />
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                      >
                        <Link href={item.href}>{t(item.name)}</Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Language Selector - Desktop */}
          <div className="hidden lg:flex lg:items-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>{t("LANGUAGE")}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-3 p-4">
                      <ListItem title="English" href="/en" />
                      <ListItem title="中文" href="/zh" />
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t">
              {navigation.map((item) => (
                <div key={item.name} className="space-y-1">
                  {item.sublinks ? (
                    <div>
                      <div className="px-3 py-2 text-sm font-medium text-foreground">
                        {t(item.name)}
                      </div>
                      <div className="pl-4 space-y-1">
                        {item.sublinks.map((sublink) => (
                          <Link
                            key={sublink.name}
                            href={sublink.href}
                            className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {t(sublink.name)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t(item.name)}
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile Language Selector */}
              <div className="pt-4 border-t">
                <div className="px-3 py-2 text-sm font-medium text-foreground">
                  {t("LANGUAGE")}
                </div>
                <div className="pl-4 space-y-1">
                  <Link
                    href="/en"
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    English
                  </Link>
                  <Link
                    href="/zh"
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    中文
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
