<script lang="ts">
  import AddMaterialDilution from './AddMaterialDilution.svelte';
  import MaterialInstanceManage from './MaterialInstanceManage.svelte';
  import Button from './components/ui/button/button.svelte';
  import { insertMaterialDilution, insertMaterialInstance } from './data/materials.svelte';
  import type { MaterialAbstract, MaterialDilutionBuilder, MaterialInstanceBuilder } from './types';

  let {
    material,
    onSubmit
  }: {
    material: MaterialAbstract;
    onSubmit: () => void;
  } = $props();

  let display: 'instance' | 'dilution' = $state('instance');

  async function createMaterialInstance(state: MaterialInstanceBuilder) {
    if (state.grams <= 0) {
      console.warn('invalid grams!', state.grams);
      return;
    }

    await insertMaterialInstance(material.id, state);

    state.reset();

    onSubmit();
  }

  async function createMaterialDilution(state: MaterialDilutionBuilder) {
    if (state.material == null) {
      console.warn('material not selected!');
      return;
    }

    if (state.gramsMaterial > state.material.grams_available) {
      console.warn('not enough material');
      return;
    }

    if (state.gramsMaterial <= 0) {
      console.warn('invalid amount!', state.gramsMaterial);
      return;
    }

    await insertMaterialDilution(state);

    state.reset();

    onSubmit();
  }
</script>

<div class="">
  <h3 class="w-full p-2 text-center text-sm text-muted-foreground">Add to inventory</h3>
  <div class="flex w-full justify-center gap-2">
    <Button
      variant={display === 'instance' ? 'default' : 'outline'}
      onclick={() => (display = 'instance')}>Pure</Button
    >
    <Button
      disabled={material.inventory.length === 0}
      variant={display === 'dilution' ? 'default' : 'outline'}
      onclick={() => (display = 'dilution')}>Dilution</Button
    >
  </div>
  {#if display === 'instance'}
    <MaterialInstanceManage onSubmit={createMaterialInstance} {material} />
  {:else if display === 'dilution'}
    <AddMaterialDilution onSubmit={createMaterialDilution} inventory={material.inventory} />
  {/if}
</div>
