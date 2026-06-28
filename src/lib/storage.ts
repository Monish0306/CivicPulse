const IMGBB_KEY = import.meta.env.VITE_IMGBB_KEY;// get from imgbb.com/api

export async function uploadIssueImage(
  file: File,
  issueId: string
): Promise<string> {
  // Step 1: Compress aggressively to stay under 500KB
  const base64 = await compressToBase64(file, 600, 0.6);

  // Step 2: Check size — if under 900KB store as base64 directly
  const sizeKB = Math.round((base64.length * 3) / 4 / 1024);

  if (sizeKB < 900) {
    return base64;
  }

  // Step 3: If still too large, compress more
  const base64Small = await compressToBase64(file, 400, 0.5);
  return base64Small;
}

function compressToBase64(
  file: File,
  maxPx: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d")!;
    const img    = new Image();
    const url    = URL.createObjectURL(file);

    img.onload = () => {
      const ratio   = Math.min(maxPx / img.width, maxPx / img.height, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
}