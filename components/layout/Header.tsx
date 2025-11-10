"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  session: Session | null;
  today: string;
}

export function Header({ session, today }: HeaderProps) {
  const [showingNavigationDropdown, setShowingNavigationDropdown] =
    useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white dark:bg-zinc-800 shadow">
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
            <ThemeToggle />
            {session ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                >
                  {session.user?.name}
                  <svg
                    className="ml-1 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <title>メニューを開く</title>
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {showUserDropdown && (
                  <>
                    {/* Backdrop */}
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setShowUserDropdown(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setShowUserDropdown(false);
                      }}
                      aria-label="メニューを閉じる"
                    />
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link
                          href="/years"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          年度一覧
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          設定
                        </Link>
                        <button
                          type="button"
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          ログアウト
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
                <title>メニュー</title>
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
          <div className="pt-2 pb-3">
            <div className="space-y-1">
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

            <div className="border-t border-gray-200 dark:border-gray-600 my-2" />

            <div className="space-y-1">
              <Link
                href="/years"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/years")
                    ? "border-sky-500 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/50"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setShowingNavigationDropdown(false)}
              >
                年度一覧
              </Link>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 my-2" />

            <div className="px-4 py-2">
              <div className="font-medium text-base text-gray-800 dark:text-gray-200">
                {session.user?.name}
              </div>
              <div className="font-medium text-sm text-gray-500 dark:text-gray-400">
                {session.user?.email}
              </div>
            </div>

            <div className="space-y-1">
              <Link
                href="/profile"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/profile")
                    ? "border-sky-500 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/50"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setShowingNavigationDropdown(false)}
              >
                設定
              </Link>
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

        {/* テーマ切り替え（モバイル） */}
        <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
        <div className="px-4 py-3 flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
