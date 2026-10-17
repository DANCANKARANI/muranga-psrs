import { FileText } from "lucide-react";

interface AttachmentLinkItem {
  id: string;
  fileName: string;
}

interface AttachmentLinksProps {
  requestId: string;
  attachments: AttachmentLinkItem[];
  hasLegacyAttachment?: boolean;
}

export function AttachmentLinks({
  requestId,
  attachments,
  hasLegacyAttachment = false,
}: AttachmentLinksProps) {
  if (attachments.length === 0 && !hasLegacyAttachment) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Supporting files
      </p>
      <ul className="mt-2 space-y-2">
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <a
              className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-[#0f2c52] underline-offset-4 hover:underline"
              download
              href={`/api/requests/${requestId}/attachments/${attachment.id}`}
            >
              <FileText aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{attachment.fileName}</span>
            </a>
          </li>
        ))}
        {hasLegacyAttachment && (
          <li>
            <a
              className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-[#0f2c52] underline-offset-4 hover:underline"
              download
              href={`/api/requests/${requestId}/attachments/legacy`}
            >
              <FileText aria-hidden="true" className="size-4 shrink-0" />
              <span>Previously uploaded document</span>
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}
