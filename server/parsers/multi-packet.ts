export class MultiPacketAssembler {
  private packets: Map<number, Buffer> = new Map();
  private totalPackets = 0;

  add(buffer: Buffer): boolean {
    this.totalPackets = buffer.readUInt32LE(30);
    const packetNo = buffer.readUInt32LE(34);
    const clusterSize = buffer.readUInt32LE(38);
    const dataStart = 42;
    const dataEnd = Math.min(dataStart + clusterSize, buffer.length);
    this.packets.set(packetNo, buffer.slice(dataStart, dataEnd));
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
