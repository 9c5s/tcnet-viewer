import type { MultiPacketHeader } from "@9c5s/node-tcnet";

export class MultiPacketAssembler {
  private packets: Map<number, Buffer> = new Map();
  private totalPackets = 0;

  // bufferはパケット全体、headerはnode-tcnet側のreadMultiPacketHeaderでパース済みの値を受ける
  // headerがnullの場合 (42バイト未満等) は不正パケットとして無視する
  add(buffer: Buffer, header: MultiPacketHeader | null): boolean {
    if (!header) return false;
    const { totalPackets: newTotalPackets, packetNo, dataClusterSize: clusterSize } = header;
    if (newTotalPackets === 0) return false;
    // totalPacketsが途中で変わった場合、古い転送を破棄して現パケットから新転送を開始する
    // (トラック変更がStatusパケットより先にデータで通知された場合のデッドロック防止)
    if (this.totalPackets > 0 && newTotalPackets !== this.totalPackets) {
      this.reset();
    }
    // packetNoの検証はtotalPackets代入前に行う
    // (不正パケットがtotalPacketsを汚染してアセンブラをロックするのを防ぐ)
    if (packetNo >= newTotalPackets) return false;
    const dataStart = 42;
    // clusterSize=0はFileパケット(Artwork等)のため、バッファ末尾までをデータとして扱う
    const end = clusterSize > 0 ? Math.min(dataStart + clusterSize, buffer.length) : buffer.length;
    // clusterSize指定時にバッファが不足している場合は切り詰めパケットとして無視する
    if (clusterSize > 0 && end !== dataStart + clusterSize) return false;
    // 全検証を通過した後にtotalPacketsを確定する
    this.totalPackets = newTotalPackets;
    // Buffer.from()でコピーを保持し、元バッファへの参照共有を防ぐ
    this.packets.set(packetNo, Buffer.from(buffer.slice(dataStart, end)));
    return this.packets.size >= this.totalPackets;
  }

  assemble(): Buffer {
    const sorted = [...this.packets.entries()].sort((a, b) => a[0] - b[0]);
    return Buffer.concat(sorted.map(([, buf]) => buf));
  }

  reset(): void {
    this.packets.clear();
    this.totalPackets = 0;
  }
}
