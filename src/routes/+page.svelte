<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { initMaterials, materials } from '$lib/materials.svelte';
  import MaterialList from '$lib/MaterialList.svelte';
  import Formula from '$lib/Formula.svelte';

  let display: 'materials' | 'formulae' = $state(
    (localStorage.getItem('lastDisplay') as 'materials' | 'formulae') ?? 'materials'
  );

  function selectDisplay(value: 'materials' | 'formulae') {
    localStorage.setItem('lastDisplay', value);
    display = value;
  }
</script>

<div class="space-y-6 p-6">
  <header class="col-span-4 flex justify-center gap-2">
    <Button
      variant={display === 'materials' ? 'default' : 'outline'}
      onclick={() => selectDisplay('materials')}>Materials</Button
    >
    <Button
      variant={display === 'formulae' ? 'default' : 'outline'}
      onclick={() => selectDisplay('formulae')}>Formulae</Button
    >
  </header>

  {#await initMaterials() then}
    {#if display === 'materials'}
      <MaterialList materialsAbstract={materials.abstract} materials={materials.inventory} />
    {:else}
      <Formula />
    {/if}
  {/await}
</div>
