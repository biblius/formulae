<script lang="ts">
  import { Info } from '@lucide/svelte';

  type Props = {
    message: string;
  };

  let { message }: Props = $props();
</script>

<div class="mt-1 flex items-center justify-center gap-2 text-xs text-destructive">
  <Info class="h-4 w-4" />
  <span>{message}</span>
</div>
