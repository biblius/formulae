<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { formulae, type FormulaType } from './data/formulae.svelte';
  import FormulaListItem from './FormulaListItem.svelte';

  let { display, onSelect } = $props<{
    display: FormulaType;
    onSelect: (display: FormulaType) => void;
  }>();
</script>

<div class="col-span-4 flex justify-center gap-2">
  <Button
    variant={display === 'MIXTURE' ? 'default' : 'outline'}
    onclick={() => onSelect('MIXTURE')}>Mixtures</Button
  >
  <Button variant={display === 'DRAFT' ? 'default' : 'outline'} onclick={() => onSelect('DRAFT')}
    >Drafts</Button
  >
</div>

<ul class="divide-y">
  {#if display === 'MIXTURE'}
    {#each formulae.formulae as _, i}
      <FormulaListItem bind:formula={formulae.formulae[i]} />
    {/each}
  {/if}

  {#if display === 'DRAFT'}
    {#each formulae.drafts as _, i}
      <FormulaListItem bind:formula={formulae.drafts[i]} />
    {/each}
  {/if}
</ul>
