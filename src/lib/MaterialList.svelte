<script lang="ts">
  import * as Select from './components/ui/select';
  import { Plus } from '@lucide/svelte';
  import Button from './components/ui/button/button.svelte';
  import MaterialListItem from './MaterialListItem.svelte';
  import { Input } from '$lib/components/ui/input';

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

  let searching = $state('');
  let searchBy: 'Name' | 'Family' | 'Tags' = $state('Name');

  let displayAbstract = $derived.by(() => {
    if (!searching) {
      return materialsAbstract;
    }

    try {
      const regex = new RegExp(searching, 'i'); // 'i' = case-insensitive
      return materialsAbstract.filter((m) => {
        switch (searchBy) {
          case 'Name':
            return regex.test(m.name);
          case 'Family':
            return m.family ? regex.test(m.family) : false;
          case 'Tags': {
            for (const tag of m.tags) {
              if (regex.test(tag)) {
                return true;
              }
            }
            return false;
          }
        }
      });
    } catch {
      return materialsAbstract.filter((m) => {
        switch (searchBy) {
          case 'Name':
            return m.name.toLowerCase().includes(searching.toLowerCase());
          case 'Family':
            return m.family?.toLowerCase().includes(searching.toLowerCase());
          case 'Tags': {
            for (const tag of m.tags) {
              if (tag.toLowerCase().includes(searching.toLowerCase())) {
                return true;
              }
            }
            return false;
          }
        }
      });
    }
  });
  let adding = $state(false);
</script>

<main>
  <h2 class="flex items-center gap-4 border-b">
    <p class="not-sm:hidden">Materials</p>
    <Input type="search" class="w-64" placeholder="Search by" bind:value={searching} />

    <Select.Root type="single" bind:value={searchBy}>
      <Select.Trigger class="text-center">
        {searchBy}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="Name" label="Name">Name</Select.Item>
        <Select.Item value="Family" label="Family">Family</Select.Item>
        <Select.Item value="Tags" label="Tags">Tags</Select.Item>
      </Select.Content>
    </Select.Root>

    <div class="flex justify-center p-2">
      <Button
        size="icon-sm"
        variant={adding ? 'default' : 'outline'}
        onclick={() => (adding = !adding)}><Plus /></Button
      >
    </div>
  </h2>

  <div class="w-full">
    {#if adding}
      <AddMaterialAbstract onSubmit={() => (adding = false)} />
    {/if}

    {#each displayAbstract as material}
      <MaterialListItem
        {material}
        inventory={materials.filter((m) => m.material_id === material.id)}
      />
    {/each}

    <h3 class="border-b">History</h3>

    <MaterialHistory type="DILUTION" />
  </div>
</main>
