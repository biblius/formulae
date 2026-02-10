<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { getLocalTimeZone, now } from '@internationalized/date';
  import type { MaterialInstanceAdd } from './types';
  import * as Popover from './components/ui/popover';
  import { cn, df } from './utils';
  import { Calendar } from './components/ui/calendar';
  import { Calendar as CalendarIcon, RefreshCw } from '@lucide/svelte';
  import * as Select from './components/ui/select';
  import { onMount } from 'svelte';
  import { insertMaterialInstance, materials, materialType } from './materials.svelte';

  let state: MaterialInstanceAdd = $state<MaterialInstanceAdd>({
    materialId: null,
    grams: 0,
    name: null,
    manufacturer: null,
    batchId: null,
    link: null,
    createdAt: now(getLocalTimeZone()),

    reset() {
      if (materials.abstract.length > 0) {
        this.materialId = materials.abstract[0].id.toString();
      } else {
        this.materialId = null;
      }
      this.name = null;
      this.grams = 0;
      this.createdAt = now(getLocalTimeZone());
      this.manufacturer = null;
      this.batchId = null;
    }
  });

  async function createMaterialInstance() {
    if (state.materialId == null) {
      console.warn('material not selected!');
      return;
    }

    if (state.grams <= 0) {
      console.warn('invalid grams!', state.grams);
      return;
    }

    await insertMaterialInstance(state);

    state.reset();
  }

  let selectedMaterial = $derived(
    materials.abstract.find((m) => {
      console.log(m.id, state.materialId);
      if (state.materialId == null) return false;
      return m.id === parseInt(state.materialId);
    })
  );

  onMount(() => {
    console.log(materials);
    if (materials.abstract.length > 0) {
      state.materialId = materials.abstract[0].id.toString();
    }
  });
</script>

<div class="m-2 flex flex-wrap items-center justify-center gap-1 rounded-md border p-2">
  <div class="grid w-full max-w-lg items-center">
    <Label for="name" class="text-xs">Material</Label>
    <Select.Root type="single" name="material" bind:value={state.materialId}>
      <Select.Trigger class="w-full">
        {#if selectedMaterial}
          {selectedMaterial.name} ({materialType(selectedMaterial.type)})
        {/if}
      </Select.Trigger>
      <Select.Content>
        {#each materials.abstract as material}
          <Select.Item value={material.id.toString()} label={material.name}>
            {material.name} ({material.type})
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <div class="grid w-full max-w-lg items-center">
    <Label for="name" class="text-xs">Name</Label>
    <Input
      bind:value={state.name}
      id="name"
      placeholder={`My first ${selectedMaterial?.name ?? 'ingredient'} (optional)`}
    />
  </div>

  <div class="grid w-full max-w-lg items-center">
    <Label for="batch" class="text-xs">Batch</Label>
    <Input bind:value={state.batchId} id="batch" placeholder="123XYZ (optional)" />
  </div>

  <div class="grid w-full max-w-lg items-center">
    <Label for="manufacturer" class="text-xs">Manufacturer</Label>
    <Input bind:value={state.manufacturer} id="manufacturer" placeholder="IFF (optional)" />
  </div>

  <div class="grid w-full max-w-lg items-center">
    <Label for="link" class="text-xs">Link</Label>
    <Input bind:value={state.link} id="link" placeholder="https://fraterworks.com (optional)" />
  </div>

  <div class="grid w-full max-w-lg items-center">
    <Label for="grams" class="text-xs">Amount (g)</Label>
    <Input bind:value={state.grams} id="amount" type="number" min="0" step="0.01" placeholder="5" />
  </div>

  <div class="grid w-full max-w-lg items-center">
    <Label class="text-xs">Created at</Label>
    <Popover.Root>
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button
            variant="outline"
            class={cn(
              'w-70 justify-start text-start font-normal',
              !state.createdAt && 'text-muted-foreground'
            )}
            {...props}
          >
            <CalendarIcon class="me-2 size-4" />
            {state.createdAt
              ? df.format(state.createdAt.toDate(getLocalTimeZone()))
              : df.format(new Date())}
          </Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content class="w-auto p-0">
        <Calendar
          bind:value={state.createdAt}
          type="single"
          initialFocus
          captionLayout="dropdown"
        />
      </Popover.Content>
    </Popover.Root>
  </div>

  <div class="mx-auto flex w-full justify-center gap-2 py-2">
    <Button class="w-32" type="button" variant="secondary" onclick={() => state.reset()}
      ><RefreshCw /></Button
    >
    <Button onclick={() => createMaterialInstance()} class="w-32" type="submit">Add</Button>
  </div>
</div>
