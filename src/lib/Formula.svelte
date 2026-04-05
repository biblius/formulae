<script lang="ts">
  import FormulaList from './FormulaList.svelte';
  import FormulaBuilder from './FormulaBuilder.svelte';
  import MaterialHistory from './MaterialHistory.svelte';
  import type { HistoryEntry } from './data/materials.svelte';
  import { ChevronDown, ChevronRight, Plus } from '@lucide/svelte';
  import type { FormulaBuilder as FormulaBuilderState } from './types';
  import { insertFormulaDraft } from './data/formulae.svelte';
  import Button from './components/ui/button/button.svelte';

  let showHistory = $state(false);
  let { history }: { history: HistoryEntry<'FORMULA'>[] } = $props();

  let display = $state((localStorage.getItem('lastFormulaDisplay') || undefined) ?? 'DRAFT');

  function selectDisplay(value: string) {
    localStorage.setItem('lastFormulaDisplay', value);
    display = value;
  }

  async function saveFormula(formula: FormulaBuilderState) {
    if (formula.materials.length === 0) {
      console.error('no materials');
      return;
    }

    for (const material of formula.materials) {
      if (material.grams <= 0) {
        console.error('material cannot be 0 or less!');
        return;
      }
    }

    await insertFormulaDraft(formula);

    formula.reset();

    adding = false;
  }

  let adding = $state(false);
</script>

<main class="m-2 justify-center gap-1 rounded-md p-2">
  <h2 class="mb-4 flex items-center gap-4 border-b">
    <p class="not-sm:hidden">Formulae</p>
    <div class="flex justify-center p-2">
      <Button
        size="icon-sm"
        variant={adding ? 'default' : 'outline'}
        onclick={() => (adding = !adding)}><Plus /></Button
      >
    </div>
  </h2>
  <!-- FORMULA LIST -->

  {#if adding}
    <FormulaBuilder onSave={saveFormula} onCancel={() => (adding = false)} />
  {/if}

  <FormulaList {display} onSelect={(v) => selectDisplay(v)} />

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
