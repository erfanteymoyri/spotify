"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Stagger, StaggerItem } from "@/components/shared/motion";
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
      ) : (
        <Stagger
          className={cn(
            layout === "grid"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              : "space-y-1",
          )}
        >
          {items.map((item, index) => (
            <StaggerItem key={index}>{renderItem(item)}</StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
