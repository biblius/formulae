<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import FragranceWheel from '$lib/FragranceWheel.svelte';
  import { CircleQuestionMark, RefreshCw } from '@lucide/svelte';
  import * as HoverCard from '$lib/components/ui/hover-card/index.js';
  import type { MaterialAbstractAdd } from './types';
  import MultiInput from './components/MultiInput.svelte';
  import * as Select from './components/ui/select';
  import { insertMaterialAbstract, MATERIAL_TYPES, materialType } from './data/materials.svelte';

  let { onSubmit } = $props();

  let state: MaterialAbstractAdd = $state<MaterialAbstractAdd>({
    name: null,
    type: 'EO',
    description: null,
    family: null,
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
      this.cas = null;
      this.links = [];
      this.linkInput = '';
      this.tagInput = '';
      this.tags = [];
    }
  });

  async function createMaterialAbstract() {
    if (state.name == null) {
      console.warn('no name');
      return;
    }

    if (state.type == null) {
      console.warn('no type');
      return;
    }

    await insertMaterialAbstract(state);

    state.reset();
    onSubmit();
  }
</script>

<div class="m-2 mx-auto flex flex-wrap items-center justify-center gap-1 rounded-md p-2">
  <h3 class="text-sm text-muted-foreground">Add definition</h3>

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
      <textarea
        id="note"
        bind:value={state.description}
        placeholder="The material that started it all (optional)"
        class="flex h-64 w-full min-w-0 rounded-md border border-input bg-transparent px-3 pt-1.5 text-sm font-medium shadow-xs ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[1px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
      ></textarea>
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <Label for="tags" class="text-xs">Tags</Label>
      <MultiInput
        bind:container={state.tags}
        input={state.tagInput}
        placeholder="Woody (optional)"
      />
    </div>
  </div>

  <div class="flex w-full items-center justify-center">
    <div class="w-1/2">
      <div class="flex items-center">
        <Label for="category" class="mr-1 text-xs">Family</Label>

        <HoverCard.Root openDelay={200} closeDelay={200}>
          <HoverCard.Trigger>
            <CircleQuestionMark size={14} />
          </HoverCard.Trigger>
          <HoverCard.Content side="right" class="w-full">
            <FragranceWheel />
          </HoverCard.Content>
        </HoverCard.Root>
      </div>

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
        input={state.linkInput}
        placeholder="https://fraterworks.com (optional)"
      />
    </div>
  </div>

  <div class="mx-auto flex w-full justify-center gap-2 py-2">
    <Button class="w-32" type="button" variant="secondary" onclick={() => state.reset()}
      ><RefreshCw /></Button
    >
    <Button onclick={() => createMaterialAbstract()} class="w-32" type="submit">Add</Button>
  </div>
</div>
