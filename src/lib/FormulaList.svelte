<script lang="ts">
  import { formulae } from './formulae.svelte';
  import FormulaListItem from './FormulaListItem.svelte';
</script>

<ul class="max-h-[80vh] divide-y overflow-y-scroll">
  {#each formulae.formulae as formula}
    <FormulaListItem bind:formula />
  {/each}
</ul>
