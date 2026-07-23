"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate } from "@/lib/format";
import { adminService } from "@/services/admin.service";
import type { ArtistRequest, ArtistStatus } from "@/types";

const STATUS_META: Record<
  ArtistStatus,
  { labelKey: string; variant: "success" | "warning" | "destructive" }
> = {
  pending: { labelKey: "admin.statusPending", variant: "warning" },
  approved: { labelKey: "admin.statusApproved", variant: "success" },
  rejected: { labelKey: "admin.statusRejected", variant: "destructive" },
};

export default function AdminArtistsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ArtistRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const viewing = requests.find((req) => req.id === viewingId) ?? null;

  useEffect(() => {
    adminService
      .getArtistRequests()
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  const applyStatus = (id: string, status: ArtistStatus) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req)),
    );
  };

  const approve = async (id: string) => {
    await adminService.reviewArtist(id, "approve");
    applyStatus(id, "approved");
    setViewingId(null);
  };

  const confirmReject = async (id: string, reason: string) => {
    await adminService.reviewArtist(id, "reject", reason);
    applyStatus(id, "rejected");
    setRejectingId(null);
    setViewingId(null);
  };

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
        title={t("admin.artistsTitle")}
        subtitle={t("admin.artistsSubtitle")}
      />

      {requests.length === 0 ? (
        <EmptyState
          title={t("admin.requestsEmptyTitle")}
          description={t("admin.requestsEmptyDescription")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => {
            const meta = STATUS_META[request.status];
            const isPending = request.status === "pending";
            return (
              <article
                key={request.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">
                      {request.stageName}
                    </h3>
                    <p className="truncate text-sm text-muted-foreground">
                      {request.email}
                    </p>
                  </div>
                  <Badge variant={meta.variant}>{t(meta.labelKey)}</Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatDate(request.createdAt)}
                </p>

                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {/* Reviewing happens on the request details view (spec 2.11.1) */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingId(request.id)}
                  >
                    <Eye className="size-4" />
                    {t("admin.viewPortfolio")}
                  </Button>
                  {isPending && (
                    <>
                      <Button size="sm" onClick={() => approve(request.id)}>
                        <Check className="size-4" />
                        {t("admin.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectingId(request.id)}
                      >
                        <X className="size-4" />
                        {t("admin.reject")}
                      </Button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PortfolioDialog
        request={viewing}
        onClose={() => setViewingId(null)}
        onApprove={approve}
        onReject={(id) => {
          setViewingId(null);
          setRejectingId(id);
        }}
      />

      <RejectDialog
        open={rejectingId !== null}
        onClose={() => setRejectingId(null)}
        onConfirm={(reason) =>
          rejectingId && confirmReject(rejectingId, reason)
        }
      />
    </div>
  );
}

function PortfolioDialog({
  request,
  onClose,
  onApprove,
  onReject,
}: {
  request: ArtistRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = request !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-background p-0 shadow-xl backdrop:bg-black/60 open:flex open:flex-col"
    >
      {request && (
        <>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">{request.stageName}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("common.close")}
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="max-h-[60vh] space-y-5 overflow-y-auto px-5 py-4">
            <div>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("common.email")}
              </p>
              <p dir="auto" className="mt-1 text-sm font-medium break-words">
                {request.email}
              </p>
            </div>
            <div>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("admin.artistSampleWorks")}
              </p>
              <p className="mt-1.5 text-sm leading-7 whitespace-pre-line">
                {request.sampleWorks}
              </p>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {formatDate(request.createdAt)}
            </p>
          </div>

          {request.status === "pending" && (
            <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onReject(request.id)}
              >
                <X className="size-4" />
                {t("admin.reject")}
              </Button>
              <Button size="sm" onClick={() => onApprove(request.id)}>
                <Check className="size-4" />
                {t("admin.approve")}
              </Button>
            </div>
          )}
        </>
      )}
    </dialog>
  );
}

function RejectDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setReason("");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-background p-0 shadow-xl backdrop:bg-black/60 open:flex open:flex-col"
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold">{t("admin.rejectTitle")}</h2>
      </div>
      <div className="space-y-2 px-5 py-4">
        <label className="text-sm font-medium">{t("admin.rejectReason")}</label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("admin.rejectReasonPlaceholder")}
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="destructive"
          disabled={!reason.trim()}
          onClick={() => onConfirm(reason.trim())}
        >
          {t("admin.confirmReject")}
        </Button>
      </div>
    </dialog>
  );
}
