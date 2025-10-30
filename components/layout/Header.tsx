"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

interface HeaderProps {
  session: Session | null;
  today: string;
}

export function Header({ session, today }: HeaderProps) {
  const [showingNavigationDropdown, setShowingNavigationDropdown] =
    useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="shrink-0 flex items-center gap-3">
              <Link
                href={session ? "/" : "/"}
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                ra
              </Link>
              <span className="text-base text-gray-600 dark:text-gray-400 relative top-0.5">
                {today}
              </span>
            </div>

            {/* Desktop Navigation */}
            {session && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive("/")
                      ? "border-sky-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  一覧
                </Link>
                <Link
                  href="/edit"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive("/edit")
                      ? "border-sky-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  編集
                </Link>
              </div>
            )}
          </div>

          {/* User Info (Desktop) */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:gap-4">
            {/* User Dropdown */}
            {session ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {session.user?.name}
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                ログイン
              </Link>
            )}
          </div>

          {/* Hamburger Menu Button (Mobile) */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              onClick={() =>
                setShowingNavigationDropdown(!showingNavigationDropdown)
              }
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-900 focus:text-gray-500 dark:focus:text-gray-400 transition duration-150 ease-in-out"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  className={
                    showingNavigationDropdown ? "hidden" : "inline-flex"
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path
                  className={
                    showingNavigationDropdown ? "inline-flex" : "hidden"
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${showingNavigationDropdown ? "block" : "hidden"} sm:hidden`}
      >
        {session && (
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive("/")
                  ? "border-sky-500 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/50"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setShowingNavigationDropdown(false)}
            >
              一覧
            </Link>
            <Link
              href="/edit"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive("/edit")
                  ? "border-sky-500 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/50"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setShowingNavigationDropdown(false)}
            >
              編集
            </Link>
          </div>
        )}

        {/* Mobile User Info */}
        {session && (
          <div className="pt-4 pb-1 border-t border-gray-200 dark:border-gray-600">
            <div className="px-4">
              <div className="font-medium text-base text-gray-800 dark:text-gray-200">
                {session.user?.name}
              </div>
              <div className="font-medium text-sm text-gray-500 dark:text-gray-400">
                {session.user?.email}
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300"
              >
                ログアウト
              </button>
            </div>
          </div>
        )}

        {!session && (
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/auth/signin"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300"
              onClick={() => setShowingNavigationDropdown(false)}
            >
              ログイン
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
