<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

  interface Props {
    layer: number;
  }
  let { layer }: Props = $props();

  let metadata = $derived(store.metadata[layer]);
  let artworkBase64 = $derived(store.artwork[layer]);
</script>

<div class="metadata-view">
  <div class="artwork-container">
    {#if artworkBase64}
      <img
        src="data:image/jpeg;base64,{artworkBase64}"
        alt="Artwork"
        class="artwork"
      />
    {:else}
      <div class="artwork-placeholder">
        <span>No Art</span>
      </div>
    {/if}
  </div>
  <div class="track-info">
    {#if metadata}
      <div class="track-title">{metadata.trackTitle || "Unknown Title"}</div>
      <div class="track-artist">{metadata.trackArtist || "Unknown Artist"}</div>
      <div class="track-details">
        <span class="detail-label">ID</span>
        <span class="detail-value">{metadata.trackID}</span>
      </div>
      <div class="track-details">
        <span class="detail-label">Key</span>
        <span class="detail-value">{metadata.trackKey || "-"}</span>
      </div>
    {:else}
      <div class="no-data">No metadata</div>
    {/if}
  </div>
</div>

<style>
  .metadata-view {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }
  .artwork-container {
    flex-shrink: 0;
  }
  .artwork {
    width: 64px;
    height: 64px;
    border-radius: 4px;
    object-fit: cover;
  }
  .artwork-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 4px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 9px;
  }
  .track-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .track-title {
    font-size: 13px;
    color: var(--text-primary);
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .track-artist {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .track-details {
    display: flex;
    gap: 6px;
    margin-top: 4px;
    font-size: 10px;
  }
  .detail-label {
    color: var(--text-muted);
  }
  .detail-value {
    color: var(--text-secondary);
  }
  .no-data {
    color: var(--text-muted);
    font-size: 11px;
    font-style: italic;
  }
</style>
