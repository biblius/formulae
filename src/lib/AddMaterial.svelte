<script lang="ts">
  import AddMaterialAbstract from './AddMaterialAbstract.svelte';
  import AddMaterialInstance from './AddMaterialInstance.svelte';
  import { db } from './db';
  import type { MaterialAbstract, MaterialAbstractAdd, MaterialInstanceAdd } from './types';
  import { getMaterial, insertMaterialAbstract, insertMaterialInstance } from './materials.svelte';
  import { now, getLocalTimeZone } from '@internationalized/date';
  import Button from './components/ui/button/button.svelte';

  let { materials }: { materials: MaterialAbstract[] } = $props();

  let display: 'abstract' | 'instance' = $state('abstract');

  let instanceState: MaterialInstanceAdd = $state<MaterialInstanceAdd>({
    materialId: null,
    amount: 0,
    name: null,
    manufacturer: null,
    batchId: null,
    link: null,
    createdAt: now(getLocalTimeZone()),

    reset() {
      if (materials.length > 0) {
        this.materialId = materials[0].toString();
      } else {
        this.materialId = null;
      }
      this.name = null;
      this.amount = 0;
      this.createdAt = now(getLocalTimeZone());
      this.manufacturer = null;
      this.batchId = null;
    }
  });

  let abstractState: MaterialAbstractAdd = $state<MaterialAbstractAdd>({
    name: null,
    type: 'EO',
    description: null,
    family: null,
    subfamily: null,
    cas: null,
    linkInput: '',
    links: [],
    tagInput: '',
    tags: [],

    reset() {
      this.name = null;
      this.type = 'EO';
      this.description = null;
      this.family = null;
      this.subfamily = null;
      this.cas = null;
      this.links = [];
      this.linkInput = '';
      this.tagInput = '';
      this.tags = [];
    }
  });

  async function createMaterialAbstract(state: MaterialAbstractAdd) {
    if (state.name == null) {
      console.warn('no name');
      return;
    }

    if (state.type == null) {
      console.warn('no type');
      return;
    }

    const material = await insertMaterialAbstract(state);

    if (instanceState.materialId == null) {
      instanceState.materialId = material.id.toString();
    }

    state.reset();
  }

  async function createMaterialInstance(state: MaterialInstanceAdd) {
    if (state.materialId == null) {
      console.warn('material not selected!');
      return;
    }

    if (state.amount <= 0) {
      console.warn('invalid amount!', state.amount);
      return;
    }

    await insertMaterialInstance(state);

    state.reset();
  }
</script>

<div class="">
  <div class="col-span-2 flex w-full justify-center">
    <Button
      variant={display === 'abstract' ? 'default' : 'outline'}
      onclick={() => (display = 'abstract')}>Definition</Button
    >
    <Button
      variant={display === 'instance' ? 'default' : 'outline'}
      onclick={() => (display = 'instance')}>Inventory</Button
    >
  </div>
  {#if display === 'abstract'}
    <AddMaterialAbstract bind:state={abstractState} onSubmit={createMaterialAbstract} />
  {:else if display === 'instance'}
    <AddMaterialInstance bind:state={instanceState} onSubmit={createMaterialInstance} {materials} />
  {/if}
</div>
