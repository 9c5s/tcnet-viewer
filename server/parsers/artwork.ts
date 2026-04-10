// 末尾のnullバイト (0x00) を除去した終端位置を返す
function findNonNullEnd(data: Buffer): number {
  let end = data.length - 1;
  while (end > 0 && data[end] === 0x00) end--;
  return end;
}

// JPEG/PNGの完全性を検証する
// JPEGはnullパディング除去後の末尾がEOIマーカー (0xFF 0xD9) であることを確認する
// バッファ全体を後方検索しない (マーカーセグメント内の0xFF 0xD9との誤一致を防ぐ)
export function isValidImageData(data: Buffer): boolean {
  // JPEG: SOI (0xFF 0xD8) + 末尾EOI (0xFF 0xD9)
  if (data.length >= 4 && data[0] === 0xff && data[1] === 0xd8) {
    const end = findNonNullEnd(data);
    return end >= 1 && data[end] === 0xd9 && data[end - 1] === 0xff;
  }
  // PNG: マジックバイト (0x89 0x50 0x4E 0x47)
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
  // TCNetは主にJPEGを送信するため、判定不可の場合はJPEGとして扱う
  return "image/jpeg";
}

export function artworkToBase64(data: Buffer): string {
  return data.toString("base64");
}

// JPEGの末尾nullパディングを除去する
// BridgeがFileパケットを固定サイズで送信するため、EOI以降にnullバイトが含まれることがある
export function trimJpegPadding(data: Buffer): Buffer {
  const end = findNonNullEnd(data);
  if (end >= 1 && data[end] === 0xd9 && data[end - 1] === 0xff) {
    return data.subarray(0, end + 1);
  }
  return data;
}

// node-tcnetがアセンブル済みの画像バッファからブロードキャスト用ペイロードを生成する
// 無効なデータの場合はnullを返す
export function processArtworkPacket(
  imageData: Buffer | undefined,
): { base64: string; mimeType: string } | null {
  if (!imageData || imageData.length === 0 || !isValidImageData(imageData)) return null;
  const trimmed = trimJpegPadding(imageData);
  return {
    base64: artworkToBase64(trimmed),
    mimeType: detectArtworkMimeType(trimmed),
  };
}
