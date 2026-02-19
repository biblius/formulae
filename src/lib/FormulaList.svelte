<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { formulae, type FormulaType } from './data/formulae.svelte';
  import FormulaListItem from './FormulaListItem.svelte';

  let display: FormulaType = $state('MIXTURE');

  let items = $derived(display === 'MIXTURE' ? formulae.formulae : formulae.drafts);

  function selectDisplay(value: FormulaType) {
    display = value;
  }
</script>

<div class="col-span-4 flex justify-center gap-2">
  <Button
    variant={display === 'MIXTURE' ? 'default' : 'outline'}
    onclick={() => selectDisplay('MIXTURE')}>Mixtures</Button
  >
  <Button
    variant={display === 'DRAFT' ? 'default' : 'outline'}
    onclick={() => selectDisplay('DRAFT')}>Drafts</Button
  >
</div>

<ul class="divide-y">
  {#each items as _, i}
    <FormulaListItem bind:formula={items[i]} />
  {/each}
</ul>
