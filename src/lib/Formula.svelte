<script lang="ts">
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import { initFormulae } from './formula.svelte';
  import FormulaList from './FormulaList.svelte';
  import FormulaBuilder from './FormulaBuilder.svelte';
  import MaterialHistory from './MaterialHistory.svelte';

  let showHistory = $state(true);
</script>

{#await initFormulae() then}
  <div class="m-2 justify-center gap-1 rounded-md p-2">
    <h2 class="border-b">Create formula</h2>

    <FormulaBuilder />

    <h2 class="my-2 border-b">Formulae</h2>
    <!-- FORMULA LIST -->

    <FormulaList />

    <!-- HISTORY -->

    <div class="my-4">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <h2 onclick={() => (showHistory = !showHistory)}>
        <div class="flex cursor-pointer items-center border-b">
          {#if showHistory}
            <ChevronDown size={14} />
          {:else}
            <ChevronRight size={14} />
          {/if}
          <p>Formula history</p>
        </div>
      </h2>

      {#if showHistory}
        <MaterialHistory type={'FORMULA'} />
      {/if}
    </div>
  </div>
{/await}
