<script lang="ts">
  let fps = $state(0);

  $effect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let handle: number;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        fps = frames;
        frames = 0;
        lastTime = now;
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  });
</script>

<div
  data-testid="fps-counter"
  class="
    pointer-events-none fixed right-2 bottom-2 z-50 rounded-sm border border-base-content/20 bg-base-100/80 px-2 py-1
    font-mono text-[10px] tracking-wider text-base-content/60
  "
>
  {fps} FPS
</div>
