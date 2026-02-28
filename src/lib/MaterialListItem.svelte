<script lang="ts">
  import * as Dialog from './components/ui/dialog';
  import { Badge } from '$lib/components/ui/badge';
  import {
    deleteMaterialAbstract,
    materialType,
    updateMaterialAbstract
  } from './data/materials.svelte';
  import { ChevronDown, ChevronRight, ExternalLink, SquarePen, Trash } from '@lucide/svelte';

  import type { MaterialAbstract, MaterialAbstractBuilder } from './types';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import Button, { buttonVariants } from './components/ui/button/button.svelte';
  import MaterialInventory from './MaterialInventory.svelte';
  import { tick } from 'svelte';
  import MaterialAbstractManage from './MaterialAbstractManage.svelte';

  let {
    material = $bindable()
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

  let editState = $state<MaterialAbstractBuilder>({
    name: material.name,
    description: material.description,
    type: material.type,
    tags: material.tags,
    links: material.links,
    tagInput: '',
    linkInput: '',

    reset() {
      this.name = material.name;
      this.description = material.description;
      this.type = material.type;
      this.tags = material.tags.map((t) => t);
      this.links = material.links.map((l) => l);
      this.tagInput = '';
      this.linkInput = '';
    }
  });

  function toggleEdit() {
    if (editing) {
      cancelEdit();
      return;
    }

    editing = true;

    editState.reset();
  }

  async function updateMaterial(builder: MaterialAbstractBuilder) {
    if (builder.tagInput) {
      builder.tags.push(builder.tagInput);
    }

    if (builder.linkInput) {
      builder.links.push(builder.linkInput);
    }

    await updateMaterialAbstract(material.id, builder);

    cancelEdit();
  }

  function cancelEdit() {
    editState.reset();
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
      <!-- {material.id} -->
    </p>

    {#if !open}
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
    {/if}
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
      <MaterialAbstractManage
        headerText="Edit definition"
        bind:state={editState}
        onSubmit={updateMaterial}
        onCancel={cancelEdit}
      />
    {:else}
      <div class="space-y-2 bg-muted/75 px-2 py-3 text-sm">
        <MaterialInventory {material} />

        {#if material.description}
          <div class="mx-2 py-2">
            <p class="mb-2 border-b py-1 text-sm text-muted-foreground">Description</p>

            <p class="text-sm whitespace-pre-wrap">
              {material.description}
            </p>
          </div>
        {/if}

        <div class="mx-2 py-2">
          <p class="mb-2 border-b py-1 text-sm text-muted-foreground">Information</p>

          <div class="mx-auto grid w-1/3 grid-cols-2 items-center gap-x-3 gap-y-1 text-sm">
            <p class="text-muted-foreground">Tags:</p>
            <p>
              {#each material.tags as tag, i}
                {#if i === material.tags.length - 1}
                  {tag}
                {:else}
                  {`${tag}, `}
                {/if}
              {/each}
            </p>

            <p class="text-muted-foreground">CAS:</p>
            <div class="flex items-center gap-1">
              {#if material.cas_number != null}
                <p>{material.cas_number}</p>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onclick={() =>
                    openUrl(
                      `https://ifrafragrance.org/standards-library?query=${material.cas_number}`
                    )}
                >
                  <ExternalLink />
                </Button>
              {:else}
                -
              {/if}
            </div>

            <p class="text-muted-foreground">Type:</p>
            <p>
              {material.type ? materialType(material.type) : '-'}
            </p>

            <p class="text-muted-foreground">Family:</p>
            <p>
              {material.family ?? '-'}
            </p>
          </div>
        </div>

        {#if material.links.length > 0}
          <div class="mx-2">
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
