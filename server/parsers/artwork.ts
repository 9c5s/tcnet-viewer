// JPEG/PNGのマジックバイトとEOIマーカーが存在するか検証する
export function isValidImageData(data: Buffer): boolean {
  // JPEG: SOI (0xFF 0xD8) + EOI (0xFF 0xD9) の両方を検証する
  if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
    // 末尾からEOIマーカーを探索する(パディングがある場合に対応)
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i] === 0xd9 && data[i - 1] === 0xff) return true;
    }
    return false;
  }
  // PNG: マジックバイト (0x89 0x50 0x4E 0x47) を検証する
  if (
    data.length >= 4 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  )
    return true;
  return false;
}

// マジックバイトからMIMEタイプを判定する
// JPEG: 0xFF 0xD8, PNG: 0x89 0x50 0x4E 0x47
export function detectArtworkMimeType(data: Buffer): string {
  if (data.length >= 2 && data[0] === 0xff && data[1] === 0xd8) return "image/jpeg";
  if (
    data.length >= 4 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  )
    return "image/png";
  return "image/jpeg";
}

export function artworkToBase64(data: Buffer): string {
  return data.toString("base64");
}

// JPEGのEOIマーカー (0xFF 0xD9) 以降のnullパディングを除去する
// BridgeがFileパケットを固定サイズで送信するため、末尾にnullバイトが含まれることがある
export function trimJpegPadding(data: Buffer): Buffer {
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i] === 0xd9 && data[i - 1] === 0xff) {
      return data.subarray(0, i + 1);
    }
  }
  return data;
}

// node-tcnetがアセンブル済みのJPEGバッファからブロードキャスト用ペイロードを生成する
// 無効なデータの場合はnullを返す
export function processArtworkPacket(
  jpeg: Buffer | undefined,
): { base64: string; mimeType: string } | null {
  if (!jpeg || jpeg.length === 0 || !isValidImageData(jpeg)) return null;
  const trimmed = trimJpegPadding(jpeg);
  return {
    base64: artworkToBase64(trimmed),
    mimeType: detectArtworkMimeType(trimmed),
  };
}
