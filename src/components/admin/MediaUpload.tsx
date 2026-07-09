import { memo, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MEDIA_BUCKET = "media";
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function sanitizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function uploadErrorMessage(message: string) {
  if (/mime|type|not allowed/i.test(message)) {
    return "Этот формат фото не поддерживается. Попробуйте JPG, PNG, WEBP, HEIC/HEIF или AVIF.";
  }
  if (/row-level security|permission|unauthorized|jwt/i.test(message)) {
    return "Нет доступа к загрузке. Выйдите из админки и войдите снова.";
  }
  if (/size|too large/i.test(message)) {
    return "Файл слишком большой. Загрузите фото меньше 50 MB.";
  }
  return message || "Не удалось загрузить файл";
}

export const MediaUpload = memo(function MediaUpload({
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
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const acceptsVideo = accept.includes("video/");
      const acceptedTypes = acceptsVideo ? new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]) : ALLOWED_IMAGE_TYPES;
      const ext = file.name.split(".").pop()?.toLowerCase() || "file";
      const detectedType = EXTENSION_TYPES[ext] || file.type;
      const contentType = detectedType || "application/octet-stream";

      if (detectedType && !acceptedTypes.has(detectedType)) {
        setError(uploadErrorMessage("mime type not allowed"));
        return;
      }

      const baseName = file.name.replace(new RegExp(`\\.${ext}$`, "i"), "");
      const safeName = sanitizeName(baseName) || "media";
      const path = `admin/${Date.now()}-${createId()}-${safeName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType });

      if (uploadError) {
        setError(uploadErrorMessage(uploadError.message));
        return;
      }

      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(uploadErrorMessage(err instanceof Error ? err.message : ""));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#171411]/45">{label}</div>
      <label className="group flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-[#171411]/18 bg-white/45 p-4 text-center transition-colors hover:border-[#171411] hover:bg-white/70">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={uploading}
          onChange={(event) => upload(event.target.files?.[0] || null)}
        />
        {value ? (
          <div className="w-full">
            <div className="mx-auto max-h-44 overflow-hidden border border-[#171411]/12 bg-[#171411]/8">
              {isVideoUrl(value) ? (
                <video src={value} className="h-44 w-full object-cover" controls muted />
              ) : (
                <img src={value} alt="" className="h-44 w-full object-cover" />
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#171411]/48 group-hover:text-[#171411]">
                Заменить файл
              </span>
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); onChange(""); }}
                className="inline-flex h-8 w-8 items-center justify-center border border-[#171411]/15 text-[#171411]/50 transition-colors hover:border-destructive hover:text-destructive"
                title="Удалить файл из формы"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[#171411]/50 group-hover:text-[#171411]">
            <Upload className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
              {uploading ? "Загрузка..." : "Загрузить фото или видео"}
            </span>
          </div>
        )}
      </label>
      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
    </div>
  );
});

export function isVideoMedia(url?: string | null) {
  return Boolean(url && isVideoUrl(url));
}
