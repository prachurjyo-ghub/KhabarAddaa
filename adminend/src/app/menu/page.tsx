"use client";

import Link from "next/link";
import { FiFolderPlus, FiPlusCircle, FiArrowRight } from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MenuHubPage() {
  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Menu
          </h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Choose what you want to manage — categories and items are separate.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <FiFolderPlus className="h-5 w-5" />
              </div>
              <CardTitle className="mt-2">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--secondary)]">
                Create and manage menu categories like Pizza, Drinks, Desserts.
              </p>
              <Button asChild className="w-full">
                <Link href="/menu/categories">
                  Manage categories
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <FiPlusCircle className="h-5 w-5" />
              </div>
              <CardTitle className="mt-2">Menu items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--secondary)]">
                Add dishes, upload images, set prices, and homepage placements.
              </p>
              <Button asChild className="w-full">
                <Link href="/menu/items">
                  Create / edit items
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
