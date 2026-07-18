"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { cn } from "@/lib/utils";

interface HomeFeedSectionProps<T> {
  title: string;
  subtitle?: string;
  items: T[];
  emptyTitle: string;
  emptyDescription: string;
  layout?: "grid" | "list";
  renderItem: (item: T) => ReactNode;
  className?: string;
}

export function HomeFeedSection<T>({
  title,
  subtitle,
  items,
  emptyTitle,
  emptyDescription,
  layout = "grid",
  renderItem,
  className,
}: HomeFeedSectionProps<T>) {
  return (
    <section className={cn("space-y-4", className)}>
      <SectionHeader title={title} subtitle={subtitle} />
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : layout === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => renderItem(item))}
        </div>
      ) : (
        <div className="space-y-1">{items.map((item) => renderItem(item))}</div>
      )}
    </section>
  );
}
