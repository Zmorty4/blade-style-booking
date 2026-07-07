import { useState } from "react";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MEDIA_BUCKET = "media";

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function sanitizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

export function MediaUpload({
  label,
  value,
  onChange,
  accept = "image/*,video/mp4,video/webm,video/quicktime",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop() || "file";
    const baseName = file.name.replace(new RegExp(`\\.${ext}$`, "i"), "");
    const safeName = sanitizeName(baseName) || "media";
    const path = `admin/${Date.now()}-${crypto.randomUUID()}-${safeName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, { cacheControl: "31536000", upsert: false });

    if (uploadError) {
      setError(uploadError.message || "Не удалось загрузить файл");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <div className="font-display text-[10px] tracking-[0.3em] text-gold mb-2">{label}</div>
      <label className="group flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-divider bg-black p-4 text-center transition-colors hover:border-gold">
        <input
          type="file"
          accept={accept}
          className="sr-only"
          disabled={uploading}
          onChange={(event) => upload(event.target.files?.[0] || null)}
        />
        {value ? (
          <div className="w-full">
            <div className="mx-auto max-h-44 overflow-hidden border border-divider bg-card">
              {isVideoUrl(value) ? (
                <video src={value} className="h-44 w-full object-cover" controls muted />
              ) : (
                <img src={value} alt="" className="h-44 w-full object-cover" />
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-display text-[10px] tracking-[0.25em] text-muted-foreground group-hover:text-gold">
                ЗАМЕНИТЬ ФАЙЛ
              </span>
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); onChange(""); }}
                className="inline-flex h-8 w-8 items-center justify-center border border-divider text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                title="Удалить файл из формы"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-gold">
            <Upload className="h-6 w-6" />
            <span className="font-display text-[10px] tracking-[0.25em]">
              {uploading ? "ЗАГРУЗКА..." : "ЗАГРУЗИТЬ ФОТО ИЛИ ВИДЕО"}
            </span>
          </div>
        )}
      </label>
      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
    </div>
  );
}

export function isVideoMedia(url?: string | null) {
  return Boolean(url && isVideoUrl(url));
}
