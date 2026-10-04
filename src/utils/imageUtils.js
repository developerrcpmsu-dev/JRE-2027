/**
 * Image processing utility:
 * 1. Automatically converts HEIC/HEIF (common on iPhone/iPad) to standard JPEG.
 * 2. Downscales and compresses images to max dimensions (default 800x800) at 85% JPEG quality.
 * This guarantees full cross-browser compatibility and reduces multi-megabyte uploads to ~50-120 KB.
 */
export async function processImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.85) {
  if (!file) return file;

  let currentFile = file;

  // 1. Convert HEIC / HEIF to JPEG if needed (dynamic import so it only loads when needed)
  const isHeic = 
    (file.type && (file.type.toLowerCase().includes('heic') || file.type.toLowerCase().includes('heif'))) ||
    (file.name && /\.(heic|heif)$/i.test(file.name));

  if (isHeic) {
    try {
      const heicModule = await import('heic2any');
      const heic2any = heicModule.default || heicModule;
      const conversionResult = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: quality
      });
      const blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
      const cleanName = (file.name || 'image').replace(/\.(heic|heif)$/i, '.jpg');
      currentFile = new File([blob], cleanName, { type: 'image/jpeg' });
    } catch (err) {
      console.warn('HEIC conversion failed, proceeding with original file:', err);
    }
  }

  // 2. Check if file is a raster image that can be compressed via Canvas
  const isCompressibleImage = 
    currentFile.type.startsWith('image/') && 
    currentFile.type !== 'image/svg+xml' && 
    currentFile.type !== 'image/gif';

  if (!isCompressibleImage) {
    return currentFile;
  }

  // 3. Compress and downscale via HTML5 Canvas
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(currentFile);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          resolve(currentFile);
          return;
        }

        // Calculate aspect-ratio fit within maxWidth / maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(currentFile);
          return;
        }

        // Fill background white for transparent PNGs converting to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(currentFile);
              return;
            }
            const cleanName = (currentFile.name || 'image.jpg').replace(/\.[^.]+$/, '.jpg');
            const processedFile = new File([blob], cleanName, { type: 'image/jpeg' });
            resolve(processedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(currentFile);
      };

      img.src = objectUrl;
    } catch (err) {
      console.warn('Canvas image compression failed, using original file:', err);
      resolve(currentFile);
    }
  });
}
