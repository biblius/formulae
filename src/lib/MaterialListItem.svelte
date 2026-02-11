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

  let {
    index,
    material,
    inventory,
    expanded = $bindable()
  }: {
    index: number;
    material: MaterialAbstract;
    inventory: Material[];
    expanded: number[];
  } = $props();

  function toggleExpand() {
    if (expanded.includes(material.id)) {
      expanded = expanded.filter((id) => id !== material.id);
      cancelEdit();
    } else {
      expanded.push(material.id);
    }
  }

  let editing = $state(false);

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

    editing = true;

    editState.name = material.name;
    editState.description = material.description;
    editState.type = material.type;
    // Prevent referencing the original
    editState.tags = material.tags.map((t) => t);
    editState.links = material.links.map((t) => t);
    editState.family = material.family;
    editState.subfamily = material.subfamily;
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
<div class="m-2 border">
  <div
    class="flex w-full cursor-pointer items-center gap-2 bg-secondary p-2 hover:bg-primary/50"
    onclick={() => toggleExpand()}
  >
    <h3 class="max-w-80 min-w-50 flex-1 p-2">
      {material.name}
    </h3>

    <Badge variant={index % 2 !== 0 ? 'default' : 'secondary'}>{materialType(material.type)}</Badge>

    <div class="w-full"></div>

    {#each material.tags as tag}
      <Badge class="rounded-md text-xs opacity-75">
        {tag}
      </Badge>
    {/each}

    <div class="justify-self-end px-4">
      {#if expanded.includes(material.id)}
        <ChevronDown size={14} />
      {:else}
        <ChevronRight size={14} />
      {/if}
    </div>
  </div>

  {#if expanded.includes(material.id)}
    <div class="space-y-2 px-2 py-3 text-sm">
      <!-- EDIT MATERIAL -->

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
                class="flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 pt-1.5 text-sm font-medium shadow-xs ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[1px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
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

          {#if editState.family}
            <div class="flex w-full items-center justify-center">
              <div class="w-1/2">
                <Label for="subfamily" class="text-xs">Subfamily</Label>
                <Input
                  id="subfamily"
                  bind:value={editState.subfamily}
                  placeholder="Citrus / Mossy Woods / Soft Amber (optional)"
                />
              </div>
            </div>
          {/if}

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
              <Button size="icon-sm" variant="destructive" onclick={() => cancelEdit()}
                ><X /></Button
              >

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
                    <Dialog.Close class={buttonVariants({ variant: 'default' })}
                      >Cancel</Dialog.Close
                    >
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

      <div class="flex items-center justify-between">
        <p class="w-full whitespace-pre text-muted-foreground">
          {material.description}
        </p>

        <div class="flex w-full items-center justify-center py-2">
          <Button variant={editing ? 'default' : 'outline'} onclick={() => toggleEdit()}>
            <SquarePen />
          </Button>
        </div>
      </div>

      {#if material.links.length > 0}
        <div class="my-2">
          <h4 class="my-2 w-full border-b text-sm text-muted-foreground">Links</h4>
          {#each material.links as link}
            <div class="flex items-center justify-start">
              <p>{link}</p>
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
</div>
