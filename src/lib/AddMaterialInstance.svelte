<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { DateFormatter, getLocalTimeZone } from '@internationalized/date';
  import type { MaterialAbstract, MaterialInstanceAdd } from './types';
  import * as Popover from './components/ui/popover';
  import { cn, df } from './utils';
  import { Calendar } from './components/ui/calendar';
  import { Calendar as CalendarIcon, RefreshCw } from '@lucide/svelte';
  import * as Select from './components/ui/select';
  import { onMount } from 'svelte';
  import { materialType } from './materials.svelte';

  let {
    state = $bindable(),
    onSubmit,
    materials
  }: {
    state: MaterialInstanceAdd;
    materials: MaterialAbstract[];
    onSubmit: (state: MaterialInstanceAdd) => void;
  } = $props();

  let selectedMaterial = $derived(
    materials.find((m) => {
      console.log(m.id, state.materialId);
      if (state.materialId == null) return false;
      return m.id === parseInt(state.materialId);
    })
  );

  onMount(() => {
    console.log(materials);
    if (materials.length > 0) {
      state.materialId = materials[0].id.toString();
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
        {#each materials as material}
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
    <Label for="amount" class="text-xs">Amount (g)</Label>
    <Input
      bind:value={state.amount}
      id="amount"
      type="number"
      min="0"
      step="0.01"
      placeholder="5"
    />
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
    <Button class="w-32" type="button" variant="secondary" onclick={state.reset}
      ><RefreshCw /></Button
    >
    <Button
      onclick={() => {
        onSubmit(state);
      }}
      class="w-32"
      type="submit">Add</Button
    >
  </div>
</div>
