<script lang="ts">
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import { initFormulae } from './formulae.svelte';
  import FormulaList from './FormulaList.svelte';
  import FormulaBuilder from './FormulaBuilder.svelte';
  import MaterialHistory from './MaterialHistory.svelte';
</script>

{#await initFormulae() then}
  <div class="m-2 justify-center gap-1 overflow-x-auto rounded-md p-2">
    <h2 class="border-b">Create formula</h2>

    <div class="overflow-x-auto">
      <FormulaBuilder />
    </div>

    <h2 class="my-2 border-b">Formulae</h2>
    <!-- FORMULA LIST -->

    <FormulaList />

    <!-- HISTORY -->

    <div class="my-4">
      <h3 class="border-b">Formula history</h3>

      <MaterialHistory type={'FORMULA'} />
    </div>
  </div>
{/await}
