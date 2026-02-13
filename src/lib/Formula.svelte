<script lang="ts">
  import FormulaList from './FormulaList.svelte';
  import FormulaBuilder from './FormulaBuilder.svelte';
  import MaterialHistory from './MaterialHistory.svelte';
  import type { HistoryEntry } from './materials.svelte';

  let { history }: { history: HistoryEntry<'FORMULA'>[] } = $props();
</script>

<div class="m-2 justify-center gap-1 overflow-x-auto rounded-md p-2">
  <h2 class="mb-2 border-b">Create formula</h2>

  <div class="overflow-x-auto rounded-md bg-secondary p-4">
    <FormulaBuilder />
  </div>

  <h2 class="my-2 border-b">Formulae</h2>
  <!-- FORMULA LIST -->

  <FormulaList />

  <!-- HISTORY -->

  <div class="my-4">
    <h3 class="border-b">Formula history</h3>

    <MaterialHistory {history} />
  </div>
</div>
