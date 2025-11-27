"use client";

import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { appConfig } from "@/lib/app-config";
import RealThemeSwitch from "./t-switch";
import ThemeSwitch from "./theme-switch";
import UserDropdown from "@/components/navigation/user-dropdown";
import { authClient } from "@/lib/auth-client";

interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

const Navbar = ({ items }: { items: NavigationItem[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession();
      setIsLoggedIn(!!session?.data?.user);
    };
    checkAuth();
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <motion.div
      className="fixed z-50 flex justify-center w-full py-6 px-4"
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="flex items-center justify-between px-6 py-3 bg-black/40 backdrop-blur-xl rounded-full   w-full max-w-3xl relative z-10 border border-transparent overflow-hidden group">
        {/* Animated Gradient Border */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-950 via-amber-600 to-red-500 opacity-0 group-hover:opacity-60 transition-opacity duration-500 -z-10" />
        <div className="absolute inset-[1px] rounded-full bg-black/40 backdrop-blur-xl -z-10" />
        <motion.div
          className="absolute inset-0 rounded-full opacity-30 -z-20"
          animate={{
            background: [
              "linear-gradient(0deg, #1a1a2e, #3d2d44ff, #1e2235)",
              "linear-gradient(120deg, #1a1a2e, #442d3fff, #1e2235)",
              "linear-gradient(240deg, #1a1a2e, #442f2dff, #1e2235)",
              "linear-gradient(360deg, #1a1a2e, #442d38ff, #1e2235)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="flex items-center">
          <motion.div
            className="w-12 h-12 mr-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ rotate: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/">
              <Image
                alt={`${appConfig.appName} Logo`}
                src={"/eventora/general/eventoranobg.svg"}
                width={100}
                height={100}
              />
            </Link>
          </motion.div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {items.map((item) => (
            <motion.div
              key={`${item.label}-${item.href}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href={item.href}
                className="text-sm text-white/90 hover:text-white transition-colors font-medium flex items-center justify-center gap-2"
              >
                {item.icon ?? null}
                {item.label}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Desktop CTA Button */}
        <motion.div
          className="hidden md:flex gap-2 items-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          <ThemeSwitch />
          {isLoggedIn ? (
            <UserDropdown />
          ) : (
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-5 py-2 text-sm text-black bg-white rounded-full hover:bg-white/90 transition-colors font-medium"
            >
              Get Started
            </a>
          )}
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden flex items-center"
          onClick={toggleMenu}
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="h-6 w-6 text-white" />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-background z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-foreground" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              {items.map((item, i) => (
                <motion.div
                  key={`${item.label}-mobile-${item.href}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <a
                    href={item.href}
                    className="text-base text-foreground/90 font-medium flex items-center justify-center gap-2"
                    onClick={toggleMenu}
                  >
                    {item.icon ?? null}
                    {item.label}
                  </a>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6 flex items-center gap-2"
              >
                <ThemeSwitch />
                {isLoggedIn ? (
                  <UserDropdown />
                ) : (
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-background bg-foreground rounded-full hover:bg-gray-800 transition-colors "
                    onClick={toggleMenu}
                  >
                    Get Started
                  </a>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export { Navbar };
