<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import type { Snippet } from 'svelte';

  type Props = { text: string; children: Snippet };
  let { text, children }: Props = $props();
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    {@render children()}
  </Tooltip.Trigger>
  <Tooltip.Content>
    <p>{text}</p>
  </Tooltip.Content>
</Tooltip.Root>
