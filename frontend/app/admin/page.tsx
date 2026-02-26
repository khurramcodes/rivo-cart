"use client";

import { useEffect, useState } from "react";
import { ArrowUpRightFromSquare } from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/services/adminApi";
import { useAppSelector } from "@/store/hooks";

export default function AdminHomePage() {
  const unreadQuestionsFromStore = useAppSelector((s) => s.notifications.unreadQuestions);
  const [stats, setStats] = useState({
    productsCount: 0,
    categoriesCount: 0,
    ordersCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await adminApi.getDashboardStats();
        if (!mounted) return;
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>
        Dashboard
      </h1>
      <p className='mt-2 text-sm text-zinc-600'>Manage catalog and orders.</p>
      <div className='mt-6 grid gap-4 sm:grid-cols-4'>
        <Link
          className='flex justify-between items-start rounded border border-zinc-200 p-4 hover:border-blue-200 hover:bg-blue-50'
          href='/admin/products'>
          <div>
            <p className='text-3xl font-normal text-zinc-900'>Products</p>
            <p className='flex items-center gap-2 mt-1 text-lg font-medium text-zinc-600'>
              Manage Products{" "}
              <span>
                <ArrowUpRightFromSquare
                  className='hover:text-blue-800'
                  size={18}
                />
              </span>
            </p>
          </div>
          <div>
            <span className='ml-1 rounded-full bg-blue-800 px-2 py-0.5 text-xs text-white'>
              {loading ? "..." : stats.productsCount}
            </span>
          </div>
        </Link>
        <Link
          className='flex justify-between items-start rounded border border-zinc-200 p-4 hover:border-blue-200 hover:bg-blue-50'
          href='/admin/categories'>
          <div>
            <p className='text-3xl font-normal text-zinc-900'>Categories</p>
            <p className='flex items-center gap-2 mt-1 text-lg font-medium text-zinc-600'>
              Manage Categories{" "}
              <span>
                <ArrowUpRightFromSquare
                  className='hover:text-blue-800'
                  size={18}
                />
              </span>
            </p>
          </div>
          <div>
            <span className='ml-1 rounded-full bg-blue-800 px-2 py-0.5 text-xs text-white'>
              {loading ? "..." : stats.categoriesCount}
            </span>
          </div>
        </Link>
        <Link
          className='flex justify-between items-start rounded border border-zinc-200 p-4 hover:border-blue-200 hover:bg-blue-50'
          href='/admin/orders'>
          <div>
            <p className='text-3xl font-normal text-zinc-900'>Orders</p>
            <p className='flex items-center gap-2 mt-1 text-lg font-medium text-zinc-600'>
              Manage Orders{" "}
              <span>
                <ArrowUpRightFromSquare
                  className='hover:text-blue-800'
                  size={18}
                />
              </span>
            </p>
          </div>
          <div>
            <span className='ml-1 rounded-full bg-blue-800 px-2 py-0.5 text-xs text-white'>
              {loading ? "..." : stats.ordersCount}
            </span>
          </div>
        </Link>
        <Link
          className='flex justify-between items-start rounded border border-zinc-200 p-4 hover:border-blue-200 hover:bg-blue-50'
          href='/admin/qa?status=VISIBLE'>
          <div>
            <p className='text-3xl font-normal text-zinc-900'>Questions</p>
            <p className='flex items-center gap-2 mt-1 text-lg font-medium text-zinc-600'>
              New customer questions{" "}
              <span>
                <ArrowUpRightFromSquare
                  className='hover:text-blue-800'
                  size={18}
                />
              </span>
            </p>
          </div>
          <div>
            <span className='ml-1 rounded-full bg-blue-800 px-2 py-0.5 text-xs text-white'>
              {loading ? "..." : unreadQuestionsFromStore}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
