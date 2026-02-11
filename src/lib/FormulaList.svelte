<script lang="ts">
  import { formulae } from './formula.svelte';
  import FormulaListItem from './FormulaListItem.svelte';
</script>

<ul class="divide-y">
  {#each formulae.formulae as formula}
    <FormulaListItem {formula} />
  {/each}
</ul>
