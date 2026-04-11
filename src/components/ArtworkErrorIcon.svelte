<script lang="ts">
  import type { SVGAttributes } from "svelte/elements";

  interface Props extends SVGAttributes<SVGElement> {
    size?: number;
  }
  let { size = 24, ...rest }: Props = $props();
</script>

<svg
  aria-hidden="true"
  data-testid="artwork-error-icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="var(--color-error)"
  opacity="0.6"
  stroke-width="2"
  stroke-linecap="round"
  {...rest}
>
  <circle cx="12" cy="12" r="10" />
  <line x1="15" y1="9" x2="9" y2="15" />
  <line x1="9" y1="9" x2="15" y2="15" />
</svg>
