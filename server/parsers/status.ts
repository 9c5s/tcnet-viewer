// StatusパケットのAPP SPECIFIC (byte 100-171, 72B) から印字可能ASCII
// (0x20-0x7E) のみ連結して返す。NULLバイトや制御文字を含む可変長の
// パディングを除去し、"PRODJLINK BR..." のような識別子だけを取り出す。
export function decodeAppSpecific(buf: Buffer | null): string | undefined {
  if (!buf) return undefined;
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    if (byte >= 0x20 && byte <= 0x7e) out += String.fromCharCode(byte);
  }
  return out || undefined;
}
