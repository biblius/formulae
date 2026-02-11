<script lang="ts">
  import { Plus } from '@lucide/svelte';
  import Button from './components/ui/button/button.svelte';
  import MaterialListItem from './MaterialListItem.svelte';

  import type { MaterialAbstract, Material } from './types';
  import AddMaterialAbstract from './AddMaterialAbstract.svelte';
  import MaterialHistory from './MaterialHistory.svelte';

  let {
    materialsAbstract,
    materials
  }: {
    materialsAbstract: MaterialAbstract[];
    materials: Material[];
  } = $props();

  let expanded: number[] = $state([]);

  let adding = $state(false);
</script>

<div class="w-full">
  <div class="flex justify-center p-2">
    <Button variant={adding ? 'default' : 'outline'} onclick={() => (adding = !adding)}
      ><Plus /></Button
    >
  </div>

  {#if adding}
    <AddMaterialAbstract onSubmit={() => (adding = false)} />
  {/if}

  {#each materialsAbstract as material, i}
    <MaterialListItem
      index={i}
      bind:expanded
      {material}
      inventory={materials.filter((m) => m.material_id === material.id)}
    />
  {/each}

  <h3>History</h3>

  <MaterialHistory type="DILUTION" />
</div>
