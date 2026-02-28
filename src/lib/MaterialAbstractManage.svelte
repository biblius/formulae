<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Check, X } from '@lucide/svelte';
  import type { MaterialAbstractBuilder } from './types';
  import MultiInput from './components/MultiInput.svelte';
  import * as Select from './components/ui/select';
  import { MATERIAL_TYPES, materialType } from './data/materials.svelte';
  import Textarea from './components/Textarea.svelte';

  let {
    headerText,
    onSubmit,
    onCancel = (state) => state.reset(),
    state = $bindable<MaterialAbstractBuilder>({
      type: 'EO',
      linkInput: '',
      links: [],
      tagInput: '',
      tags: [],

      reset() {
        this.name = undefined;
        this.type = 'EO';
        this.description = undefined;
        this.family = undefined;
        this.cas = undefined;
        this.links = [];
        this.linkInput = '';
        this.tagInput = '';
        this.tags = [];
      }
    })
  }: {
    headerText: string;
    onSubmit: (m: MaterialAbstractBuilder) => void;
    onCancel?: (m: MaterialAbstractBuilder) => void;
    state?: MaterialAbstractBuilder;
  } = $props();
</script>

<div class="m-2 mx-auto flex flex-wrap items-center justify-center gap-1 rounded-md p-2">
  <h3 class="text-sm text-muted-foreground">{headerText}</h3>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="name" class="text-xs">Name</Label>
      <Input id="name" bind:value={state.name} placeholder="Patchouli EO" />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="type" class="text-xs">Type</Label>
      <Select.Root type="single" bind:value={state.type}>
        <Select.Trigger class="w-full text-center">
          {materialType(state.type)}
        </Select.Trigger>
        <Select.Content>
          {#each MATERIAL_TYPES as type}
            <Select.Item value={type} label={type}>
              {materialType(type)}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="note" class="text-xs">Description</Label>
      <Textarea
        bind:value={state.description}
        placeholder="The material that started it all (optional)"
      />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="tags" class="text-xs">Tags</Label>
      <MultiInput
        bind:container={state.tags}
        bind:input={state.tagInput}
        placeholder="Woody (optional)"
      />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="category" class="mr-1 text-xs">Family</Label>
      <Input
        id="category"
        bind:value={state.family}
        placeholder="Fresh / Woody / Amber / Floral (optional)"
      />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="cas" class="text-xs">CAS number</Label>
      <Input id="cas" bind:value={state.cas} placeholder="123-45-6 (optional)" />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="link" class="text-xs">Links</Label>
      <MultiInput
        bind:container={state.links}
        bind:input={state.linkInput}
        placeholder="https://fraterworks.com (optional)"
      />
    </div>
  </div>

  <div class="mx-auto flex w-full items-center justify-center gap-2 py-2">
    <Button size="icon-sm" variant="destructive" onclick={() => onCancel(state)}><X /></Button>
    <Button size="icon-sm" onclick={() => onSubmit(state)} type="submit"><Check /></Button>
  </div>
</div>
