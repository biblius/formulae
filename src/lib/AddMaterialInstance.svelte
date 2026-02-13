<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { getLocalTimeZone, now } from '@internationalized/date';
  import type { MaterialAbstract, MaterialInstanceAdd } from './types';
  import * as Popover from './components/ui/popover';
  import { cn, df } from './utils';
  import { Calendar } from './components/ui/calendar';
  import { Calendar as CalendarIcon, RefreshCw } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { insertMaterialInstance, materials } from './materials.svelte';

  let { material, onSubmit }: { material: MaterialAbstract; onSubmit: () => void } = $props();

  let state: MaterialInstanceAdd = $state<MaterialInstanceAdd>({
    grams: 0,
    name: null,
    manufacturer: null,
    batchId: null,
    link: null,
    createdAt: now(getLocalTimeZone()),
    predilution: null,

    reset() {
      this.name = null;
      this.grams = 0;
      this.createdAt = now(getLocalTimeZone());
      this.manufacturer = null;
      this.batchId = null;
      this.predilution = null;
    }
  });

  async function createMaterialInstance() {
    if (state.grams <= 0) {
      console.warn('invalid grams!', state.grams);
      return;
    }

    await insertMaterialInstance(material.id, state);

    state.reset();

    onSubmit();
  }
</script>

<div class="m-2 flex flex-wrap items-center justify-center gap-4 rounded-md p-2">
  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="name" class="text-xs">Name</Label>
      <Input
        bind:value={state.name}
        id="name"
        placeholder={`My first ${material?.name ?? 'ingredient'} (optional)`}
      />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="batch" class="text-xs">Batch</Label>
      <Input bind:value={state.batchId} id="batch" placeholder="123XYZ (optional)" />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="manufacturer" class="text-xs">Manufacturer</Label>
      <Input bind:value={state.manufacturer} id="manufacturer" placeholder="IFF (optional)" />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="link" class="text-xs">Link</Label>
      <Input bind:value={state.link} id="link" placeholder="https://fraterworks.com (optional)" />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="grams" class="text-xs">Amount (g)</Label>
      <Input
        bind:value={state.grams}
        id="amount"
        type="number"
        min="0"
        step="0.01"
        placeholder="5"
      />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="grams" class="text-xs">Predilution (%)</Label>
      <Input bind:value={state.predilution} id="amount" type="number" min="0" step="0.01" />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2 p-2">
      <div class="text-center">
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
                {df.format(state.createdAt.toDate(getLocalTimeZone()))}
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
    </div>
  </div>

  <div class="mx-auto flex w-full justify-center gap-2 py-2">
    <Button class="w-32" type="button" variant="secondary" onclick={() => state.reset()}
      ><RefreshCw /></Button
    >
    <Button onclick={() => createMaterialInstance()} class="w-32" type="submit">Add</Button>
  </div>
</div>
