import { FileText } from "lucide-react";
import Image from "next/image";

interface AttachmentLinkItem {
  id: string;
  fileName: string;
  contentType?: string;
}

interface AttachmentLinksProps {
  requestId: string;
  attachments: AttachmentLinkItem[];
  hasLegacyAttachment?: boolean;
  legacyFileName?: string | null;
}

export function AttachmentLinks({
  requestId,
  attachments,
  hasLegacyAttachment = false,
  legacyFileName,
}: AttachmentLinksProps) {
  if (attachments.length === 0 && !hasLegacyAttachment) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Supporting files
      </p>
      <ul className="mt-2 space-y-2">
        {attachments.map((attachment) => {
          const href = `/api/requests/${requestId}/attachments/${attachment.id}`;
          const isImage = attachment.contentType === "image/jpeg" || attachment.contentType === "image/png";
          return <li className="rounded-lg border border-slate-200 p-3" key={attachment.id}>
            {isImage && <div className="mb-3 max-w-xl">
              <Image alt={`Preview of ${attachment.fileName}`} className="max-h-[200px] w-auto max-w-full rounded-md border border-slate-200 object-cover" height={400} src={`${href}?view=1`} unoptimized width={640} />
              <a className="mt-2 inline-flex rounded-md bg-[#0f2c52] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#183d6b]" href={`${href}?view=1`} rel="noopener noreferrer" target="_blank">View Full Image</a>
            </div>}
            <a
              className="inline-flex max-w-full items-center gap-2 text-sm font-medium text-[#0f2c52] underline-offset-4 hover:underline"
              download
              href={href}
            >
              <FileText aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{attachment.fileName}</span>
            </a>
          </li>;
        })}
        {hasLegacyAttachment && (
          <li>
            {legacyFileName && /\.(png|jpe?g)(?:\?.*)?$/i.test(legacyFileName) && <div className="mb-3 max-w-xl">
              <Image alt="Preview of previously uploaded image" className="max-h-[200px] w-auto max-w-full rounded-md border border-slate-200 object-cover" height={400} src={`/api/requests/${requestId}/attachments/legacy?view=1`} unoptimized width={640} />
              <a className="mt-2 inline-flex rounded-md bg-[#0f2c52] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#183d6b]" href={`/api/requests/${requestId}/attachments/legacy?view=1`} rel="noopener noreferrer" target="_blank">View Full Image</a>
            </div>}
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
