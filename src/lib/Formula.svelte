<script lang="ts">
  import FormulaList from './FormulaList.svelte';
  import FormulaBuilder from './FormulaBuilder.svelte';
  import MaterialHistory from './MaterialHistory.svelte';
  import type { HistoryEntry } from './data/materials.svelte';
  import { ChevronDown, ChevronRight, Plus } from '@lucide/svelte';
  import type { FormulaBuilder as FormulaBuilderState } from './types';
  import { insertFormula, type FormulaType } from './data/formulae.svelte';
  import Button from './components/ui/button/button.svelte';

  let showHistory = $state(false);
  let { history }: { history: HistoryEntry<'FORMULA'>[] } = $props();

  let display: FormulaType = $state(
    (localStorage.getItem('lastFormulaDisplay') as FormulaType | undefined) ?? 'DRAFT'
  );

  function selectDisplay(value: FormulaType) {
    localStorage.setItem('lastFormulaDisplay', value);
    display = value;
  }

  async function saveFormula(formula: FormulaBuilderState) {
    if (formula.materials.length === 0) {
      return;
    }

    for (const material of formula.materials) {
      if (material.grams > material.original.grams_available && formula.type === 'MIXTURE') {
        console.error('insufficient material');
        return;
      }
    }

    await insertFormula(formula);

    selectDisplay(formula.type);

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
  {:else}
    <FormulaList {display} onSelect={selectDisplay} />
  {/if}

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
