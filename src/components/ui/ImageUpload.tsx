import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import { imageService, type UploadResult } from '../../services/imageService';
import { extractApiError } from '../../services/api';
import { cn } from '../../utils/cn';

interface ImageUploadProps {
  folder?: string;
  value?: UploadResult[];
  onChange?: (images: UploadResult[]) => void;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({ folder = 'general', value = [], onChange, maxFiles = 10, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const results = await Promise.all(
        acceptedFiles.map((file) => imageService.upload(file, folder))
      );
      onChange?.([...value, ...results]);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setUploading(false);
    }
  }, [folder, value, onChange]);

  const removeImage = (publicId: string) => {
    onChange?.(value.filter((img) => img.publicId !== publicId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: maxFiles - (value?.length ?? 0),
    disabled: uploading,
  });

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          isDragActive
            ? 'border-forest-400 bg-forest-50'
            : 'border-ink-200 bg-ink-50 hover:border-forest-300 hover:bg-forest-50/50',
          uploading && 'cursor-not-allowed opacity-60'
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-8 w-8 text-forest-500 animate-spin" />
        ) : (
          <Upload className="h-8 w-8 text-ink-400" />
        )}
        {isDragActive ? (
          <p className="text-sm font-medium text-forest-600">Drop images here...</p>
        ) : uploading ? (
          <p className="text-sm text-ink-500">Uploading...</p>
        ) : (
          <>
            <p className="text-sm font-medium text-ink-600">
              Drag & drop images here, or <span className="text-forest-600">browse</span>
            </p>
            <p className="text-xs text-ink-400">JPEG, PNG, WebP, GIF — max 10 MB each</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Preview grid */}
      {(value?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {value.map((img) => (
            <div key={img.publicId} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-100">
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(img.publicId)}
                className="absolute right-1 top-1 rounded-full bg-ink-900/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
