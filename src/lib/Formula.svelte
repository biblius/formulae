<script lang="ts">
  import FormulaList from './FormulaList.svelte';
  import FormulaBuilder from './FormulaBuilder.svelte';
  import MaterialHistory from './MaterialHistory.svelte';
  import type { HistoryEntry } from './materials.svelte';
  import { ChevronDown, ChevronRight } from '@lucide/svelte';

  let showHistory = $state(false);
  let { history }: { history: HistoryEntry<'FORMULA'>[] } = $props();
</script>

<main class="m-2 justify-center gap-1 rounded-md p-2">
  <h2 class="mb-2 border-b">Create formula</h2>

  <div class="overflow-x-auto rounded-md bg-muted/50 p-4">
    <FormulaBuilder />
  </div>

  <h2 class="my-2 border-b">Formulae</h2>
  <!-- FORMULA LIST -->

  <FormulaList />

  <!-- HISTORY -->

  <div class="my-4">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <h3
      onclick={() => (showHistory = !showHistory)}
      class="my-4 flex cursor-pointer items-center border-b"
    >
      {#if showHistory}
        <ChevronDown size={14} />
      {:else}
        <ChevronRight size={14} />
      {/if}
      Formula history
    </h3>

    {#if showHistory}
      <MaterialHistory {history} />
    {/if}
  </div>
</main>
