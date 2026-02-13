<script lang="ts">
  import { formulae } from './data/formulae.svelte';
  import FormulaListItem from './FormulaListItem.svelte';
</script>

<ul class="divide-y">
  {#each formulae.formulae as _, i}
    <FormulaListItem bind:formula={formulae.formulae[i]} />
  {/each}
</ul>
