<script lang="ts">
  import * as Select from './components/ui/select';
  import { ChevronDown, ChevronRight, Plus } from '@lucide/svelte';
  import Button from './components/ui/button/button.svelte';
  import MaterialListItem from './MaterialListItem.svelte';
  import { Input } from '$lib/components/ui/input';

  import type { MaterialAbstract, MaterialAbstractBuilder } from './types';
  import MaterialAbstractManage from './MaterialAbstractManage.svelte';
  import MaterialHistory from './MaterialHistory.svelte';
  import { insertMaterialAbstract, type HistoryEntry } from './data/materials.svelte';
  import MaterialInventoryTable from './MaterialInventoryTable.svelte';

  let {
    materialsAbstract,
    history
  }: {
    materialsAbstract: MaterialAbstract[];
    history: HistoryEntry<'DILUTION'>[];
  } = $props();

  let display = $state<'full' | 'inventory'>(
    (localStorage.getItem('materialsDisplay') as 'full' | 'inventory') ?? 'full'
  );

  function selectDisplay(value: 'full' | 'inventory') {
    localStorage.setItem('materialsDisplay', value);
    display = value;
  }

  let showHistory = $state(false);
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

  async function createMaterialAbstract(state: MaterialAbstractBuilder) {
    if (state.name == null) {
      console.warn('no name');
      return;
    }

    if (state.type == null) {
      console.warn('no type');
      return;
    }

    if (state.tagInput) {
      state.tags.push(state.tagInput);
    }

    if (state.linkInput) {
      state.links.push(state.linkInput);
    }

    await insertMaterialAbstract(state);

    state.reset();

    adding = false;
  }
</script>

<main>
  <h2 class="mb-4 flex items-center gap-4 border-b">
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

    <div class="flex w-full justify-end">
      <Select.Root
        type="single"
        bind:value={display}
        onValueChange={(v) => selectDisplay(v as 'full' | 'inventory')}
      >
        <Select.Trigger class="text-center">
          {display === 'full' ? 'Full' : 'Inventory'}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="full" label="full">Full</Select.Item>
          <Select.Item value="inventory" label="inventory">Inventory</Select.Item>
        </Select.Content>
      </Select.Root>
    </div>
  </h2>

  {#if adding}
    <MaterialAbstractManage
      headerText={'Add definition'}
      onSubmit={createMaterialAbstract}
      onCancel={(state) => {
        state.reset();
        adding = false;
      }}
    />
  {/if}

  {#if display === 'full'}
    <ul class="w-full">
      {#each displayAbstract as _, i}
        <MaterialListItem material={displayAbstract[i]} />
      {/each}
    </ul>
  {/if}

  {#if display === 'inventory'}
    <MaterialInventoryTable definitions={displayAbstract} />
  {/if}

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <h3
    onclick={() => (showHistory = !showHistory)}
    class="my-4 flex cursor-pointer items-center border-b"
  >
    {#if showHistory}
      <ChevronDown size={14} />
    {:else}
      <ChevronRight size={14} />
    {/if}
    Dilution history
  </h3>
  {#if showHistory}
    <MaterialHistory {history} />
  {/if}
</main>
