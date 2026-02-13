<script lang="ts">
  import * as HoverCard from '$lib/components/ui/hover-card/index.js';
  import * as Select from './components/ui/select';
  import * as Dialog from './components/ui/dialog';
  import { Badge } from '$lib/components/ui/badge';
  import {
    deleteMaterialAbstract,
    MATERIAL_TYPES,
    materialType,
    updateMaterialAbstract
  } from './materials.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    Check,
    ChevronDown,
    ChevronRight,
    CircleQuestionMark,
    ExternalLink,
    SquarePen,
    Trash,
    X
  } from '@lucide/svelte';

  import type { MaterialAbstract, Material, MaterialAbstractEdit } from './types';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import Button, { buttonVariants } from './components/ui/button/button.svelte';
  import FragranceWheel from './FragranceWheel.svelte';
  import MultiInput from './components/MultiInput.svelte';
  import MaterialInventory from './MaterialInventory.svelte';
  import { tick } from 'svelte';

  let {
    material,
    inventory
  }: {
    material: MaterialAbstract;
    inventory: Material[];
  } = $props();

  let editing = $state(false);
  let open = $state(false);

  async function toggleOpen() {
    open = !open;
    if (open) {
      await tick(); // wait for expanded DOM
      document.getElementById(`material-${material.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  let editState = $state<MaterialAbstractEdit>({
    name: '',
    description: '',
    type: 'EO',
    tags: [],
    links: [],
    tagInput: '',
    linkInput: ''
  });

  function toggleEdit() {
    if (editing) {
      cancelEdit();
      return;
    }

    open = true;
    editing = true;

    editState.name = material.name;
    editState.description = material.description;
    editState.type = material.type;
    // Prevent referencing the original
    editState.tags = material.tags.map((t) => t);
    editState.links = material.links.map((t) => t);
    editState.family = material.family;
    editState.cas = material.cas_number;
  }

  async function updateMaterial() {
    await updateMaterialAbstract(material.id, editState);

    cancelEdit();
  }

  function cancelEdit() {
    editState.name = '';
    editState.description = '';
    editState.type = 'EO';
    editState.tags = [];
    editState.links = [];
    editState.tagInput = '';
    editState.linkInput = '';

    editing = false;
  }

  async function deleteMaterial() {
    await deleteMaterialAbstract(material.id);

    cancelEdit();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<li id={`material-${material.id}`} class="m-2 border">
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="flex w-full cursor-pointer items-center gap-2 bg-muted/50 p-1"
    onclick={() => toggleOpen()}
  >
    <p class="min-w-fit flex-1">
      {material.name}
    </p>

    <div class="flex items-center">
      <Button variant={editing ? 'default' : 'ghost'} onclick={() => toggleEdit()}>
        <SquarePen />
      </Button>
    </div>

    <Badge class="opacity-75 not-sm:hidden">{materialType(material.type)}</Badge>

    {#if material.family}
      <Badge class="opacity-75 not-sm:hidden">{material.family}</Badge>
    {/if}

    <div class="w-full not-sm:hidden"></div>

    {#each material.tags as tag}
      <Badge class="rounded-lg p-0.5 text-xs opacity-75 not-sm:hidden">
        {tag}
      </Badge>
    {/each}

    <div class="justify-self-end px-4 not-sm:hidden">
      {#if open}
        <ChevronDown size={14} />
      {:else}
        <ChevronRight size={14} />
      {/if}
    </div>
  </div>

  {#if editing}
    <div class="m-2 flex flex-wrap items-center justify-center gap-1 rounded-md border-t p-2">
      <h3 class="w-full text-center text-sm text-muted-foreground">Edit definition</h3>

      <div class="flex w-full items-center justify-center">
        <div class="w-1/2">
          <Label for="name" class="text-xs">Name</Label>
          <Input bind:value={editState.name} id="name" />
        </div>
      </div>

      <div class="flex w-full items-center justify-center">
        <div class="w-1/2">
          <Label for="type" class="text-xs">Type</Label>
          <Select.Root type="single" bind:value={editState.type}>
            <Select.Trigger class="w-full text-center">
              {materialType(editState.type)}
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
            bind:value={editState.description}
            placeholder="The material that started it all (optional)"
            class="flex h-64 w-full min-w-0 rounded-md border border-input bg-transparent px-3 pt-1.5 text-sm font-medium shadow-xs ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[1px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
          ></textarea>
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
            bind:value={editState.family}
            placeholder="Fresh / Woody / Amber / Floral (optional)"
          />
        </div>
      </div>

      <div class="flex w-full items-center justify-center">
        <div class="w-1/2">
          <Label for="link" class="text-xs">Tags</Label>
          <MultiInput bind:container={editState.tags} input={editState.tagInput} />
        </div>
      </div>

      <div class="flex w-full items-center justify-center">
        <div class="w-1/2">
          <Label for="link" class="text-xs">Links</Label>
          <MultiInput
            bind:container={editState.links}
            input={editState.linkInput}
            placeholder="https://fraterworks.com (optional)"
          />
        </div>
      </div>

      <div class="flex w-full items-center justify-center">
        <div class="flex w-1/2 justify-center gap-2 py-2">
          <Button size="icon-sm" onclick={() => updateMaterial()}><Check /></Button>
          <Button size="icon-sm" variant="destructive" onclick={() => cancelEdit()}><X /></Button>

          <Dialog.Root>
            <Dialog.Trigger>
              <Button size="icon-sm" variant="destructive"><Trash /></Button>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Delete material definition {material.name}?</Dialog.Title>
                <Dialog.Description>
                  This action cannot be undone. This will permanently delete the inventory
                  associated with this material.
                </Dialog.Description>
              </Dialog.Header>

              <Dialog.Footer>
                <Dialog.Close class={buttonVariants({ variant: 'default' })}>Cancel</Dialog.Close>
                <Button type="submit" variant="destructive" onclick={() => deleteMaterial()}
                  >Delete</Button
                >
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Root>
        </div>
      </div>
    </div>
  {/if}

  {#if open && !editing}
    <div class="space-y-2 bg-secondary px-2 py-3 text-sm">
      <!-- EDIT MATERIAL -->

      <div class="flex items-center justify-center">
        <p class="w-1/2 text-center whitespace-pre-wrap text-muted-foreground">
          {material.description}
        </p>
      </div>

      {#if material.links.length > 0}
        <div class="mx-2 my-4">
          <h4 class="border-b text-sm">Links</h4>
          {#each material.links as link}
            <div class="flex items-center justify-start">
              <p class="text-muted-foreground">{link}</p>
              <Button size="icon-sm" variant="ghost" onclick={() => openUrl(link)}
                ><ExternalLink /></Button
              >
            </div>
          {/each}
        </div>
      {/if}

      <MaterialInventory {inventory} {material} />
    </div>
  {/if}
</li>
