<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';

  import './layout.css';

  const { children } = $props();
</script>

<ModeWatcher />

<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>
