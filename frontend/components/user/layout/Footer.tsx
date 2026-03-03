"use client";

import { Facebook, Linkedin, Twitter, Youtube } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { catalogApi } from "@/services/catalogApi";
import type { Category } from "@/types";

const footerLinks = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Best Sellers", href: "/bset-sellers" },
  { label: "FAQs", href: "/faqs" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Return & Refund Policy", href: "/return-refund-policy" },
];

const socialIcons = [
  { Icon: Facebook, label: "Facebook", href: "#" },
  { Icon: Linkedin, label: "LinkedIn", href: "#" },
  { Icon: Twitter, label: "Twitter", href: "#" },
  { Icon: Youtube, label: "YouTube", href: "#" },
];

const Footer = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const all = await catalogApi.listCategories();
        if (!mounted) return;
        setCategories(all);
      } catch {
        if (mounted) setCategories([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  return (
    <footer className='border-t border-border bg-primary text-white'>
      <div className='max-w-7xl mx-auto px-4 py-12'>
        <div className='grid gap-10 sm:grid-cols-2 md:grid-cols-4'>
          {/* Column 1 - Brand */}
          <div>
            <h2 className='text-2xl font-bold font-serif mb-3'>
              Mishal Organics
            </h2>
            <p className='text-sm text-white/80 leading-relaxed'>
              100% organic supplements crafted from nature's finest ingredients
              for a healthier, stronger you.
            </p>

            <div className='mt-5 flex gap-3'>
              {socialIcons.map(({ Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className='flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary transition hover:scale-105'>
                  <Icon className='h-4 w-4' />
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2 - Categories (Dynamic) */}
          <div>
            <h3 className='mb-4 text-base font-semibold'>Categories</h3>
            <ul className='space-y-2'>
              {parentCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className='text-sm text-white/80 hover:text-white transition'>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Useful Links */}
          <div>
            <h3 className='mb-4 text-base font-semibold'>Useful Links</h3>
            <ul className='space-y-2'>
              {footerLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className='text-sm text-white/80 hover:text-white transition'>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Contact Details */}
          <div>
            <h3 className='mb-4 text-base font-semibold'>Contact Us</h3>
            <ul className='space-y-2 text-sm text-white/80'>
              <li>📍 Lahore, Pakistan</li>
              <li>
                📞 <a href='tel:+923001234567'>+92 300 1234567</a>
              </li>
              <li>
                💬{" "}
                <a href='https://wa.me/923001234567' target='_blank'>
                  WhatsApp
                </a>
              </li>
              <li>
                ✉️{" "}
                <a href='mailto:info@mishalorganics.com'>
                  info@mishalorganics.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
