"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/hooks/use-translation";
import { formatNumber } from "@/lib/format";
import { adminService } from "@/services/admin.service";
import type { ArtistPayout } from "@/types";

export default function AdminAccountingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<ArtistPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    adminService
      .getPayouts()
      .then(setPayouts)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const settle = async (id: string) => {
    setSettlingId(id);
    await adminService.settlePayout(id);
    setPayouts((prev) =>
      prev.map((payout) =>
        payout.id === id ? { ...payout, status: "paid" } : payout,
      ),
    );
    setSettlingId(null);
  };

  if (!isAdmin) {
    return (
      <EmptyState
        title={t("admin.adminOnlyTitle")}
        description={t("admin.adminOnlyDescription")}
      />
    );
  }

  if (loading) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("admin.accountingTitle")}
        subtitle={t("admin.accountingSubtitle")}
      />

      {payouts.length === 0 ? (
        <EmptyState
          title={t("admin.payoutsEmptyTitle")}
          description={t("admin.payoutsEmptyDescription")}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-muted/50 text-start text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">
                  {t("admin.payoutArtist")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("admin.payoutListeners")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("admin.payoutStreams")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("admin.payoutAmount")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("admin.payoutStatus")}
                </th>
                <th className="px-4 py-3 font-medium">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => {
                const paid = payout.status === "paid";
                return (
                  <tr
                    key={payout.id}
                    className="border-t border-border tabular-nums"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{payout.artistName}</p>
                      {/* Artist id column required by spec 2.11.2 */}
                      <p dir="ltr" className="mt-0.5 text-xs text-muted-foreground/70">
                        {payout.artistId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(payout.uniqueListeners)}
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(payout.totalStreams)}
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(payout.amount)} {t("subscription.toman")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={paid ? "success" : "warning"}>
                        {paid
                          ? t("admin.paidStatus")
                          : t("admin.pendingStatus")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        disabled={paid || settlingId === payout.id}
                        onClick={() => settle(payout.id)}
                      >
                        {t("admin.settle")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
