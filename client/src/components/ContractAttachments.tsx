import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ATTACHMENT_ALLOWED_MIME, ATTACHMENT_MAX_BYTES } from "@shared/const";
import { Paperclip, Upload, Trash2, FileText, Image as ImageIcon, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Lang = "sk" | "cz" | "en";

const TX: Record<Lang, {
  title: string;
  subtitle: string;
  upload: string;
  hint: string;
  empty: string;
  errType: string;
  errSize: string;
  errUpload: string;
}> = {
  sk: {
    title: "Prílohy a súbory",
    subtitle: "Nahrajte doplňujúce dokumenty alebo médiá k tejto zmluve.",
    upload: "Nahrať súbor",
    hint: "Podporované: PDF, DOCX, obrázky. Maximálne 20 MB na súbor.",
    empty: "Zatiaľ žiadne prílohy.",
    errType: "Nepodporovaný typ súboru.",
    errSize: "Súbor je príliš veľký (max 20 MB).",
    errUpload: "Nahrávanie zlyhalo. Skúste to prosím znova.",
  },
  cz: {
    title: "Přílohy a soubory",
    subtitle: "Nahrajte doplňující dokumenty nebo média k této smlouvě.",
    upload: "Nahrát soubor",
    hint: "Podporováno: PDF, DOCX, obrázky. Maximálně 20 MB na soubor.",
    empty: "Zatím žádné přílohy.",
    errType: "Nepodporovaný typ souboru.",
    errSize: "Soubor je příliš velký (max 20 MB).",
    errUpload: "Nahrávání selhalo. Zkuste to prosím znovu.",
  },
  en: {
    title: "Attachments & files",
    subtitle: "Upload supporting documents or media for this contract.",
    upload: "Upload file",
    hint: "Supported: PDF, DOCX, images. Max 20 MB per file.",
    empty: "No attachments yet.",
    errType: "Unsupported file type.",
    errSize: "File is too large (max 20 MB).",
    errUpload: "Upload failed. Please try again.",
  },
};

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function ContractAttachments({
  contractId,
  language,
}: {
  contractId: number;
  language: string;
}) {
  const tx = TX[(language as Lang)] || TX.sk;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const listQuery = trpc.attachments.list.useQuery({ contractId });
  const uploadMutation = trpc.attachments.upload.useMutation();
  const removeMutation = trpc.attachments.remove.useMutation();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!ATTACHMENT_ALLOWED_MIME.includes(file.type)) {
        toast.error(`${file.name}: ${tx.errType}`);
        continue;
      }
      if (file.size > ATTACHMENT_MAX_BYTES) {
        toast.error(`${file.name}: ${tx.errSize}`);
        continue;
      }
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = () => reject(new Error("read error"));
          reader.readAsDataURL(file);
        });
        await uploadMutation.mutateAsync({ contractId, fileName: file.name, mimeType: file.type, fileBase64: base64 });
      } catch {
        toast.error(`${file.name}: ${tx.errUpload}`);
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    await listQuery.refetch();
  };

  const handleRemove = async (id: number) => {
    try {
      await removeMutation.mutateAsync({ id });
      await listQuery.refetch();
    } catch {
      toast.error(tx.errUpload);
    }
  };

  const items = listQuery.data || [];

  return (
    <div className="mb-8" data-testid="contract-attachments">
      <h3 className="font-serif text-xl font-semibold flex items-center gap-2 mb-1">
        <Paperclip className="h-5 w-5 text-primary" />
        {tx.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-3">{tx.subtitle}</p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACHMENT_ALLOWED_MIME.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        data-testid="attachment-input"
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        data-testid="attachment-upload-button"
      >
        {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
        {tx.upload}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">{tx.hint}</p>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="attachment-empty">{tx.empty}</p>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2"
              data-testid={`attachment-item-${a.id}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {a.mimeType.startsWith("image/") ? (
                  <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.fileName}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(a.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="ghost" size="icon" data-testid={`attachment-download-${a.id}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(a.id)}
                  disabled={removeMutation.isPending}
                  data-testid={`attachment-delete-${a.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
