import type { Area } from 'react-easy-crop';

/** Width/height ratio every item image is cropped to. */
export const ITEM_IMAGE_ASPECT = 1; // square

/** Size of the saved image in pixels (keeps uploads small and consistent). */
const OUTPUT_WIDTH = 800;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });

/**
 * Cuts the selected area out of the source file and returns it as a new JPEG File
 * of exactly OUTPUT_WIDTH x (OUTPUT_WIDTH / aspect) pixels.
 */
export const cropImageToFile = async (
  file: File,
  area: Area,
  aspect: number = ITEM_IMAGE_ASPECT,
): Promise<File> => {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = Math.round(OUTPUT_WIDTH / aspect);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // White background so transparent PNGs don't turn black as JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Crop failed'))), 'image/jpeg', 0.9),
    );

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
};
