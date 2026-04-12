import { expect, test } from "vite-plus/test";
import { MultiPacketAssembler } from "../../server/parsers/multi-packet.js";
import { createMultiPacketBuffer, makeMultiPacketHeader } from "./builders.js";

// 実運用ではbuffer+headerを同時にnode-tcnet経由で受け取るため、テストでもペアで渡すヘルパーを使う
function addPacket(
  asm: MultiPacketAssembler,
  totalPackets: number,
  packetNo: number,
  clusterSize: number,
  data: number[],
): boolean {
  return asm.add(
    createMultiPacketBuffer(totalPackets, packetNo, clusterSize, data),
    makeMultiPacketHeader(totalPackets, packetNo, clusterSize),
  );
}

test("add: 単一パケットで完了する", () => {
  const assembler = new MultiPacketAssembler();
  expect(addPacket(assembler, 1, 0, 3, [10, 20, 30])).toBe(true);
});

test("add: 全パケット揃うまでfalseを返す", () => {
  const assembler = new MultiPacketAssembler();
  expect(addPacket(assembler, 2, 0, 4, [1, 2, 3, 4])).toBe(false);
  expect(addPacket(assembler, 2, 1, 4, [5, 6, 7, 8])).toBe(true);
});

test("assemble: 逆順で到着したパケットを番号順に結合する", () => {
  const assembler = new MultiPacketAssembler();
  addPacket(assembler, 2, 1, 3, [40, 50, 60]);
  addPacket(assembler, 2, 0, 3, [10, 20, 30]);
  const result = assembler.assemble();
  expect(result.readUInt8(0)).toBe(10);
  expect(result.readUInt8(3)).toBe(40);
  expect(result.length).toBe(6);
});

test("assemble: 順不同の3パケットを番号順に結合する", () => {
  const assembler = new MultiPacketAssembler();
  addPacket(assembler, 3, 2, 2, [50, 60]);
  addPacket(assembler, 3, 0, 2, [10, 20]);
  addPacket(assembler, 3, 1, 2, [30, 40]);
  const result = assembler.assemble();
  expect([...result]).toEqual([10, 20, 30, 40, 50, 60]);
});

test("add: 同一パケット番号は上書きされる", () => {
  const assembler = new MultiPacketAssembler();
  addPacket(assembler, 1, 0, 2, [10, 20]);
  addPacket(assembler, 1, 0, 2, [99, 88]);
  const result = assembler.assemble();
  expect(result.readUInt8(0)).toBe(99);
});

test("reset: 内部状態をクリアする", () => {
  const assembler = new MultiPacketAssembler();
  addPacket(assembler, 2, 0, 2, [1, 2]);
  assembler.reset();
  expect(addPacket(assembler, 1, 0, 2, [99, 88])).toBe(true);
  expect(assembler.assemble().readUInt8(0)).toBe(99);
});

test("add: headerがnull (42バイト未満等) の場合は無視する", () => {
  const assembler = new MultiPacketAssembler();
  expect(assembler.add(Buffer.alloc(41), null)).toBe(false);
});

test("add: totalPackets=0のパケットは無視する", () => {
  const assembler = new MultiPacketAssembler();
  expect(addPacket(assembler, 0, 0, 3, [1, 2, 3])).toBe(false);
});

test("add: totalPacketsが途中で変化するとリセットして現パケットから新転送を開始する", () => {
  const assembler = new MultiPacketAssembler();
  addPacket(assembler, 3, 0, 2, [1, 2]);
  // totalPacketsが3→1に変化: 古い転送は破棄され、このパケット自体が新転送として処理される
  expect(addPacket(assembler, 1, 0, 2, [10, 20])).toBe(true);
  expect([...assembler.assemble()]).toEqual([10, 20]);
});

test("add: 範囲外packetNoは進行中アセンブリを壊さない", () => {
  const assembler = new MultiPacketAssembler();
  // 正常パケット0を受信
  expect(addPacket(assembler, 2, 0, 2, [1, 2])).toBe(false);
  // 範囲外packetNo=2は無視される (進行中データは保持)
  expect(addPacket(assembler, 2, 2, 2, [99, 99])).toBe(false);
  // 正常パケット1で転送完了
  expect(addPacket(assembler, 2, 1, 2, [10, 20])).toBe(true);
  expect([...assembler.assemble()]).toEqual([1, 2, 10, 20]);
});

test("add: 切り詰めパケットは進行中アセンブリを壊さない", () => {
  const assembler = new MultiPacketAssembler();
  // 正常パケット0を受信
  expect(addPacket(assembler, 2, 0, 2, [1, 2])).toBe(false);
  // clusterSize=100だがバッファは3バイトしかない (header側のclusterSizeを優先)
  const truncated = Buffer.alloc(45);
  truncated.writeUInt8(10, 42);
  expect(assembler.add(truncated, makeMultiPacketHeader(2, 1, 100))).toBe(false);
  // 正常パケット1で転送完了
  expect(addPacket(assembler, 2, 1, 2, [10, 20])).toBe(true);
  expect([...assembler.assemble()]).toEqual([1, 2, 10, 20]);
});
