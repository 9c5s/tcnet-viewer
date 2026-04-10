export class MultiPacketAssembler {
  private packets: Map<number, Buffer> = new Map();
  private totalPackets = 0;

  add(buffer: Buffer): boolean {
    // バッファが最小ヘッダサイズ未満なら不正パケットとして無視する
    if (buffer.length < 42) return false;
    const newTotalPackets = buffer.readUInt32LE(30);
    if (newTotalPackets === 0) return false;
    // totalPacketsが途中で変わった場合は不整合パケットとして無視する
    if (this.totalPackets > 0 && newTotalPackets !== this.totalPackets) return false;
    this.totalPackets = newTotalPackets;
    const packetNo = buffer.readUInt32LE(34);
    const clusterSize = buffer.readUInt32LE(38);
    const dataStart = 42;
    // clusterSize=0はFileパケット(Artwork等)のため、バッファ末尾までをデータとして扱う
    const end = clusterSize > 0 ? Math.min(dataStart + clusterSize, buffer.length) : buffer.length;
    // clusterSize指定時にバッファが不足している場合は切り詰めパケットとして無視する
    if (clusterSize > 0 && end !== dataStart + clusterSize) return false;
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
