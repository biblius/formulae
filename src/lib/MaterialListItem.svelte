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
  } from './data/materials.svelte';
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

  import type { MaterialAbstract, MaterialAbstractEdit } from './types';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import Button, { buttonVariants } from './components/ui/button/button.svelte';
  import FragranceWheel from './FragranceWheel.svelte';
  import MultiInput from './components/MultiInput.svelte';
  import MaterialInventory from './MaterialInventory.svelte';
  import { tick } from 'svelte';
  import Textarea from './components/Textarea.svelte';

  let {
    material
  }: {
    material: MaterialAbstract;
  } = $props();

  let editing = $state(false);
  let open = $state(false);
  let deleteDialogOpen = $state(false);

  async function toggleOpen() {
    open = !open;
    if (open) {
      await tick(); // wait for expanded DOM
      document.getElementById(`material-${material.id}`)?.scrollIntoView({
        behavior: 'instant',
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
    if (editState.tagInput) {
      editState.tags.push(editState.tagInput);
    }

    if (editState.linkInput) {
      editState.links.push(editState.linkInput);
    }

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
    open = false;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<li
  id={`material-${material.id}`}
  class="mx-auto my-2 w-5/6 rounded-md border border-muted not-sm:w-full"
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="flex w-full cursor-pointer items-center justify-between gap-2 bg-secondary/50 p-2 hover:bg-primary/10"
    onclick={() => toggleOpen()}
  >
    <p class="max-w-1/2 flex-1 px-2">
      {material.name}
    </p>

    <div class="flex-1">
      <Badge class="opacity-75">{materialType(material.type)}</Badge>
    </div>

    <div class="flex-1">
      {#if material.family}
        <Badge class="opacity-75">{material.family}</Badge>
      {/if}
    </div>

    <div class="flex w-1/2 flex-2 flex-wrap gap-2 not-sm:hidden">
      {#each material.tags as tag}
        <Badge class="rounded-lg p-0.5 text-xs opacity-75 ">
          {tag}
        </Badge>
      {/each}
    </div>

    <div class="justify-self-end px-4 not-md:hidden">
      {#if open}
        <ChevronDown size={14} />
      {:else}
        <ChevronRight size={14} />
      {/if}
    </div>
  </div>

  {#if open}
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
            <Textarea
              bind:value={editState.description}
              placeholder="The material that started it all (optional)"
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
              bind:value={editState.family}
              placeholder="Fresh / Woody / Amber / Floral (optional)"
            />
          </div>
        </div>

        <div class="flex w-full items-center justify-center">
          <div class="w-1/2">
            <Label for="link" class="text-xs">Tags</Label>
            <MultiInput bind:container={editState.tags} bind:input={editState.tagInput} />
          </div>
        </div>

        <div class="flex w-full items-center justify-center">
          <div class="w-1/2">
            <Label for="link" class="text-xs">Links</Label>
            <MultiInput
              bind:container={editState.links}
              bind:input={editState.linkInput}
              placeholder="https://fraterworks.com (optional)"
            />
          </div>
        </div>

        <div class="flex w-full items-center justify-center">
          <div class="flex w-1/2 justify-center gap-2 py-2">
            <Button size="icon-sm" onclick={() => updateMaterial()}><Check /></Button>
            <Button size="icon-sm" variant="destructive" onclick={() => cancelEdit()}><X /></Button>
          </div>
        </div>
      </div>
    {:else}
      <div class="space-y-2 bg-muted/75 px-2 py-3 text-sm">
        <MaterialInventory {material} />

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

        <div class="flex w-full justify-between">
          <Button variant={editing ? 'default' : 'ghost'} onclick={() => toggleEdit()}>
            <SquarePen />
          </Button>

          <Dialog.Root bind:open={deleteDialogOpen}>
            <Dialog.Trigger>
              <Button class="hover:text-destructive" size="icon-sm" variant="ghost"
                ><Trash /></Button
              >
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
                <Button
                  type="submit"
                  variant="destructive"
                  onclick={() => {
                    deleteMaterial();
                    deleteDialogOpen = false;
                  }}>Delete</Button
                >
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Root>
        </div>
      </div>
    {/if}
  {/if}
</li>
