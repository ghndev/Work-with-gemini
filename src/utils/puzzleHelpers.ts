export const calculateGrid = (
  imageUrl: string,
  targetPieces: number,
): Promise<{ cols: number; rows: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const totalArea = img.width * img.height;
        const pieceArea = totalArea / targetPieces;
        const pieceSize = Math.sqrt(pieceArea);

        const cols = Math.max(2, Math.round(img.width / pieceSize));
        const rows = Math.max(2, Math.round(img.height / pieceSize));

        resolve({ cols, rows });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () =>
      reject(new Error('Failed to load image to calculate aspect ratio'));
    img.src = imageUrl;
  });
};
