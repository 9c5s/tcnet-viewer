import { expect, test } from "vite-plus/test";
import { MultiPacketAssembler } from "../../server/parsers/multi-packet.js";
import { createMultiPacketBuffer } from "./builders.js";

test("add: 単一パケットで完了する", () => {
  const assembler = new MultiPacketAssembler();
  const buf = createMultiPacketBuffer(1, 0, 3, [10, 20, 30]);
  expect(assembler.add(buf)).toBe(true);
});

test("add: 全パケット揃うまでfalseを返す", () => {
  const assembler = new MultiPacketAssembler();
  expect(assembler.add(createMultiPacketBuffer(2, 0, 4, [1, 2, 3, 4]))).toBe(false);
  expect(assembler.add(createMultiPacketBuffer(2, 1, 4, [5, 6, 7, 8]))).toBe(true);
});

test("assemble: パケット番号順に結合する", () => {
  const assembler = new MultiPacketAssembler();
  assembler.add(createMultiPacketBuffer(2, 0, 3, [10, 20, 30]));
  assembler.add(createMultiPacketBuffer(2, 1, 3, [40, 50, 60]));
  const result = assembler.assemble();
  expect(result.readUInt8(0)).toBe(10);
  expect(result.readUInt8(3)).toBe(40);
  expect(result.length).toBe(6);
});

test("assemble: 3パケットを番号順に結合する", () => {
  const assembler = new MultiPacketAssembler();
  assembler.add(createMultiPacketBuffer(3, 0, 2, [10, 20]));
  assembler.add(createMultiPacketBuffer(3, 1, 2, [30, 40]));
  assembler.add(createMultiPacketBuffer(3, 2, 2, [50, 60]));
  const result = assembler.assemble();
  expect([...result]).toEqual([10, 20, 30, 40, 50, 60]);
});

test("add: 同一パケット番号は上書きされる", () => {
  const assembler = new MultiPacketAssembler();
  assembler.add(createMultiPacketBuffer(1, 0, 2, [10, 20]));
  assembler.add(createMultiPacketBuffer(1, 0, 2, [99, 88]));
  const result = assembler.assemble();
  expect(result.readUInt8(0)).toBe(99);
});

test("reset: 内部状態をクリアする", () => {
  const assembler = new MultiPacketAssembler();
  assembler.add(createMultiPacketBuffer(2, 0, 2, [1, 2]));
  assembler.reset();
  expect(assembler.add(createMultiPacketBuffer(1, 0, 2, [99, 88]))).toBe(true);
  expect(assembler.assemble().readUInt8(0)).toBe(99);
});

test("add: packetNo=0の再到着で途中データを破棄する", () => {
  const assembler = new MultiPacketAssembler();
  assembler.add(createMultiPacketBuffer(3, 0, 2, [1, 2]));
  assembler.add(createMultiPacketBuffer(3, 1, 2, [3, 4]));
  // 新しいデータセットの先頭パケットが到着
  assembler.add(createMultiPacketBuffer(1, 0, 2, [99, 88]));
  const result = assembler.assemble();
  expect([...result]).toEqual([99, 88]);
});

test("add: clusterSizeがバッファ実長を超える場合は実際の長さでクランプする", () => {
  const assembler = new MultiPacketAssembler();
  const buffer = Buffer.alloc(45);
  buffer.writeUInt32LE(1, 30);
  buffer.writeUInt32LE(0, 34);
  buffer.writeUInt32LE(100, 38);
  buffer.writeUInt8(10, 42);
  buffer.writeUInt8(20, 43);
  buffer.writeUInt8(30, 44);
  assembler.add(buffer);
  const result = assembler.assemble();
  expect(result.length).toBe(3);
});
