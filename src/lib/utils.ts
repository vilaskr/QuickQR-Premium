import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const downloadAsPng = (elementId: string, filename: string) => {
  const canvas = document.getElementById(elementId) as HTMLCanvasElement;
  if (!canvas) return;

  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
};

export const copyToClipboard = async (elementId: string) => {
  const canvas = document.getElementById(elementId) as HTMLCanvasElement;
  if (!canvas) return;

  try {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
    if (blob) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    }
  } catch (err) {
    console.error('Failed to copy image: ', err);
    return false;
  }
};
