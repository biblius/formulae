<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import { initTheme } from '$lib/theme';

  import './layout.css';
  import { onMount } from 'svelte';

  const { children } = $props();

  onMount(() => {
    initTheme();
  });
</script>

<Tooltip.Provider delayDuration={0.1}>
  {@render children()}
</Tooltip.Provider>
