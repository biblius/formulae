<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import Editable from './Editable.svelte';
  import { Minus, Plus } from '@lucide/svelte';

  let { amount = $bindable(), onSave, onclickP, onclickM, formatter } = $props();
</script>

<Editable bind:value={amount} {onSave}>
  {#snippet display({ value, startEdit })}
    <div class="flex items-center gap-2">
      <p ondblclick={startEdit} class="w-full text-center">
        {formatter.format(value)}
      </p>
      <Button size="icon-sm" variant="ghost" onclick={onclickP}><Plus /></Button>
      <Button size="icon-sm" variant="ghost" onclick={onclickM}><Minus /></Button>
    </div>
  {/snippet}
</Editable>
