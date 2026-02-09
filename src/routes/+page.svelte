<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import AddMaterial from '$lib/AddMaterial.svelte';
  import { initMaterials, materials } from '$lib/materials.svelte';
  import MaterialList from '$lib/MaterialList.svelte';
  import FormulaBuilder from '$lib/FormulaBuilder.svelte';

  let display: 'materials' | 'formulae' = $state('formulae');
</script>

<div class="grid grid-cols-4 space-y-6 p-6">
  <header class="col-span-4 flex justify-center gap-2">
    <Button
      variant={display === 'materials' ? 'default' : 'outline'}
      onclick={() => (display = 'materials')}>Materials</Button
    >
    <Button
      variant={display === 'formulae' ? 'default' : 'outline'}
      onclick={() => (display = 'formulae')}>Formulae</Button
    >
  </header>

  {#await initMaterials() then}
    {#if display === 'materials'}
      <AddMaterial materials={materials.abstract} />

      <div class="col-span-3">
        <MaterialList materialsAbstract={materials.abstract} materials={materials.inventory} />
      </div>
    {:else}
      <div class="col-span-4">
        <FormulaBuilder />
      </div>
    {/if}
  {/await}
</div>
