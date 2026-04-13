import type { LayerInfo, MetadataData, MetricsData } from "../types.js";

/**
 * metadata[i] が layers[i] の現行トラックと一致するかを判定する。
 * null の場合は false (整合性不明として扱う)。
 */
export function isMetadataConsistent(layer: LayerInfo, metadata: MetadataData | null): boolean {
  if (!metadata) return false;
  return metadata.trackID === layer.trackID;
}

/**
 * metrics[i] が layers[i] の現行トラックと一致するかを判定する。
 * null の場合は false。
 */
export function isMetricsConsistent(layer: LayerInfo, metrics: MetricsData | null): boolean {
  if (!metrics) return false;
  return metrics.trackID === layer.trackID;
}
