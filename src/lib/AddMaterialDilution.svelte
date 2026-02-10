<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { getLocalTimeZone, now } from '@internationalized/date';
  import type { Material, MaterialDilutionAdd } from './types';
  import * as Popover from './components/ui/popover';
  import { cn, df, pf } from './utils';
  import { Calendar } from './components/ui/calendar';
  import { Calendar as CalendarIcon, Info, RefreshCw } from '@lucide/svelte';
  import * as Select from './components/ui/select';
  import { insertMaterialDilution, materials } from './materials.svelte';

  let state: MaterialDilutionAdd = $state<MaterialDilutionAdd>({
    material: null,
    name: null,
    gramsMaterial: 1,
    gramsTotal: 10,
    createdAt: now(getLocalTimeZone()),

    reset() {
      this.material = null;
      this.name = null;
      this.gramsMaterial = 1;
      this.gramsTotal = 10;
      this.createdAt = now(getLocalTimeZone());
    }
  });

  async function createMaterialDilution() {
    if (state.material == null) {
      console.warn('material not selected!');
      return;
    }

    if (state.gramsMaterial <= 0) {
      console.warn('invalid amount!', state.gramsMaterial);
      return;
    }

    await insertMaterialDilution(state);

    state.reset();
  }

  let selectedMaterial: Material | undefined = $derived(
    materials.inventory.find((m) => {
      console.log(m.id, state.material);
      if (state.material == null) return false;
      return m.id === state.material.id;
    })
  );

  let concentration = $derived(state.gramsMaterial / state.gramsTotal);
  let exceeded = $derived(state.material && state.gramsMaterial > state.material.grams_available);
</script>

<div class="m-2 flex flex-wrap items-center justify-center gap-1 rounded-md border p-2">
  <div class="grid w-full max-w-lg items-center">
    <Label for="name" class="text-xs">Material</Label>
    <Select.Root
      type="single"
      onValueChange={(value) => {
        const id = parseInt(value);
        const material = materials.inventory.find((m) => m.id === id);
        if (material) {
          state.material = material;
        }
      }}
    >
      <Select.Trigger class="w-full">
        {#if selectedMaterial}
          {selectedMaterial.name} ({selectedMaterial.type})
        {:else}
          Select material
        {/if}
      </Select.Trigger>
      <Select.Content>
        {#each materials.inventory.filter((m) => m.type !== 'DILUTION') as material}
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
      placeholder={`${selectedMaterial?.name ?? 'My material'} ${pf.format(concentration)} dilution (optional)`}
    />
  </div>

  <div class="grid w-full max-w-lg items-center border-destructive">
    <Label for="amount" class="text-xs">Amount material (g)</Label>
    <Input
      class={exceeded
        ? 'border-destructive bg-destructive/5 focus-visible:border-destructive focus-visible:ring-destructive'
        : ''}
      bind:value={state.gramsMaterial}
      id="amount"
      type="number"
      min="0"
      step="0.01"
      placeholder="1"
    />
    {#if exceeded}
      <div class="mt-1 flex items-center gap-2 text-xs text-destructive">
        <Info class="h-4 w-4" />
        <span>Not enough material</span>
      </div>
    {/if}
  </div>

  <div class="grid w-full max-w-lg items-center">
    <Label for="amount" class="text-xs">Amount total (g)</Label>
    <Input
      bind:value={state.gramsTotal}
      id="amount"
      type="number"
      min="0"
      step="0.1"
      placeholder="10"
    />
  </div>

  <div class="w-full max-w-lg py-2 text-center text-sm">
    {pf.format(concentration)}
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
    <Button disabled={exceeded} onclick={() => createMaterialDilution()} class="w-32" type="submit"
      >Add</Button
    >
  </div>
</div>
