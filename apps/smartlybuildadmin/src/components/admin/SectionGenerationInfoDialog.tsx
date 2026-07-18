import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Info, Cpu, ListChecks, AlertTriangle } from "lucide-react";

export type ContentGenerationProgress = {
  projectId?: string;
  status?: string;
  total?: number;
  done?: number;
  failed?: number;
  skipped?: number;
  pending?: number;
  percent?: number;
  parallelWorkers?: number;
  activeWorkers?: number;
  currentSections?: string[];
  recentEvents?: Array<{ at?: string; status?: string; sectionId?: string; message?: string }>;
  startedAt?: string | null;
  updatedAt?: string | null;
  finishedAt?: string | null;
  message?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  progress: ContentGenerationProgress | null | undefined;
  defaultParallelWorkers?: number;
};

function statusLabel(status?: string) {
  const s = String(status || "idle").toLowerCase();
  if (s === "generating") return "Generating";
  if (s === "completed" || s === "completed_with_errors") return "Completed";
  if (s === "failed") return "Failed";
  return "Not started";
}

export function SectionGenerationInfoDialog({
  open,
  onOpenChange,
  projectName,
  progress,
  defaultParallelWorkers = 6,
}: Props) {
  const total = Number(progress?.total || 0);
  const done = Number(progress?.done || 0);
  const failed = Number(progress?.failed || 0);
  const skipped = Number(progress?.skipped || 0);
  const pending = Number(
    progress?.pending ?? Math.max(0, total - done - failed - skipped)
  );
  const percent = Number(progress?.percent || 0);
  const parallel = Number(progress?.parallelWorkers || defaultParallelWorkers);
  const active = Number(progress?.activeWorkers || 0);
  const status = String(progress?.status || "idle");
  const isGenerating = status === "generating";
  const isComplete = status === "completed" || status === "completed_with_errors";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Content generation — {projectName}
          </DialogTitle>
          <DialogDescription>
            Live status for OpenAI section generation (parallel workers via Bull/Redis).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-2">
            <Badge
              className={
                isGenerating
                  ? "bg-amber-100 text-amber-800"
                  : isComplete
                    ? "bg-green-100 text-green-800"
                    : status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-700"
              }
            >
              {isGenerating && <Loader2 className="h-3 w-3 mr-1 animate-spin inline" />}
              {isComplete && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
              {statusLabel(status)}
            </Badge>
            <span className="text-sm font-semibold text-gray-800">{percent}%</span>
          </div>

          <Progress value={percent} className="h-2" />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3 bg-slate-50">
              <div className="text-xs text-slate-500">Total sections</div>
              <div className="text-lg font-bold">{total}</div>
            </div>
            <div className="rounded-lg border p-3 bg-green-50">
              <div className="text-xs text-green-700">Generated</div>
              <div className="text-lg font-bold text-green-800">{done}</div>
            </div>
            <div className="rounded-lg border p-3 bg-amber-50">
              <div className="text-xs text-amber-700">Left / pending</div>
              <div className="text-lg font-bold text-amber-800">{pending}</div>
            </div>
            <div className="rounded-lg border p-3 bg-red-50">
              <div className="text-xs text-red-700">Failed</div>
              <div className="text-lg font-bold text-red-800">{failed}</div>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Cpu className="h-4 w-4 text-blue-600" />
              Parallel workers
            </div>
            <p className="text-sm text-slate-600">
              Configured pool: <strong>{parallel}</strong> concurrent OpenAI section jobs.
              {isGenerating ? (
                <>
                  {" "}
                  Active right now: <strong>{active}</strong>.
                </>
              ) : null}
            </p>
            <p className="text-xs text-slate-500">
              One OpenAI API key can handle this concurrency. Tune via{" "}
              <code className="bg-slate-100 px-1 rounded">SECTION_GENERATION_CONCURRENCY</code>{" "}
              (default 6). Higher values are faster until you hit rate limits (429).
            </p>
          </div>

          {Array.isArray(progress?.currentSections) && progress.currentSections.length > 0 ? (
            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ListChecks className="h-4 w-4" />
                Currently generating
              </div>
              <ul className="text-xs text-slate-600 space-y-1 max-h-24 overflow-y-auto">
                {progress.currentSections.map((s) => (
                  <li key={s} className="font-mono truncate">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {Array.isArray(progress?.recentEvents) && progress.recentEvents.length > 0 ? (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-sm font-semibold">Recent events</div>
              <ul className="text-xs space-y-1.5 max-h-40 overflow-y-auto">
                {progress.recentEvents.slice(0, 20).map((ev, i) => (
                  <li key={`${ev.at}-${i}`} className="flex gap-2 text-slate-600">
                    <span className="text-slate-400 shrink-0">
                      {ev.at ? new Date(ev.at).toLocaleTimeString() : "—"}
                    </span>
                    <span>
                      {ev.message ||
                        `${ev.status || ""} ${ev.sectionId || ""}`.trim() ||
                        "Update"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {skipped > 0 ? (
            <p className="text-xs text-slate-500 flex items-start gap-1">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {skipped} section(s) skipped (duplicates / already generated).
            </p>
          ) : null}

          {progress?.message ? (
            <p className="text-sm text-slate-700 border-t pt-3">{progress.message}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
