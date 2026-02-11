<script lang="ts">
  import { formulae } from './formulae.svelte';
  import FormulaListItem from './FormulaListItem.svelte';
</script>

<ul class="divide-y">
  {#each formulae.formulae as formula}
    <FormulaListItem {formula} />
  {/each}
</ul>
