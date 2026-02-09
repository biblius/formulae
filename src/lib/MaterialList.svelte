<script lang="ts">
  import MaterialListItem from './MaterialListItem.svelte';

  import type { MaterialAbstract, Material } from './types';

  let {
    materialsAbstract,
    materials
  }: {
    materialsAbstract: MaterialAbstract[];
    materials: Material[];
  } = $props();

  let expanded: number[] = $state([]);
</script>

{#each materialsAbstract as material, i}
  <MaterialListItem
    index={i}
    bind:expanded
    {material}
    inventory={materials.filter((m) => m.material_id === material.id)}
  />
{/each}
