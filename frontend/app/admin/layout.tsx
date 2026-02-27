"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/services/authApi";
import { adminApi } from "@/services/adminApi";
import { logout, setUser } from "@/store/slices/authSlice";
import { setNotificationStats } from "@/store/slices/notificationSlice";
import { Bell, Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.auth.status);
  const unreadNotifications = useAppSelector((s) => s.notifications.unread);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    let mounted = true;
    (async () => {
      try {
        const me = await authApi.me();
        if (!mounted) return;
        dispatch(setUser(me.user));
        if (me.user.role !== "ADMIN") router.replace("/admin/login");
      } catch {
        if (!mounted) return;
        dispatch(setUser(null));
        router.replace("/admin/login");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch, pathname, router, status]);

  useEffect(() => {
    if (status === "loading" || user?.role !== "ADMIN") return;
    let mounted = true;
    const loadStats = async () => {
      try {
        const stats = await adminApi.getNotificationStats();
        if (!mounted) return;
        dispatch(setNotificationStats(stats));
      } catch {
        // ignore transient failures
      }
    };
    void loadStats();
    const timer = setInterval(() => {
      void loadStats();
    }, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [dispatch, pathname, status, user?.role]);

  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Notifications", href: "/admin/notifications" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Categories", href: "/admin/categories" },
    { label: "Products", href: "/admin/products" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Reviews", href: "/admin/reviews" },
    { label: "Q&A", href: "/admin/qa" },
    { label: "Discounts", href: "/admin/discounts" },
    { label: "Shipping", href: "/admin/shipping" },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const isLoginPage = pathname === "/admin/login";

  // If on login page, don't show navbar or sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-8xl items-center justify-between px-4 py-3">

          <Logo />

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded border border-zinc-200 p-2 text-zinc-700 hover:bg-zinc-50"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          {user?.role === "ADMIN" ? (
            <div className="flex items-center gap-3">
              <Link
                href="/admin/notifications?unreadOnly=true"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={16} />
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-4 text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
              <span className="hidden sm:inline text-sm text-zinc-600">
                {user.name || "Admin"}
              </span>
              <Button
                variant="ghost"
                className="text-sm h-9 px-3"
                onClick={() => {
                  void dispatch(logout()).then(() => router.replace("/admin/login"));
                }}
              >
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex max-w-full">
        <aside className="hidden lg:block w-60 border-r border-zinc-200 px-4">
          <div className="sticky top-6 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 text-sm font-medium transition ${isActive(item.href)
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </aside>
        <main className="flex-1 px-4 py-10 lg:pl-8">{children}</main>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <span className="text-sm font-semibold text-zinc-800">Admin Menu</span>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded border border-zinc-200 p-2 text-zinc-700 hover:bg-zinc-50"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="space-y-1 px-4 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`block rounded px-3 py-2 text-sm font-medium transition ${isActive(item.href)
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
