<script lang="ts">
  import * as HoverCard from '$lib/components/ui/hover-card/index.js';
  import * as Select from './components/ui/select';
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
  import { df, gf, pf } from './utils';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import Button from './components/ui/button/button.svelte';
  import FragranceWheel from './FragranceWheel.svelte';
  import MultiInput from './components/MultiInput.svelte';

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

  function startEdit() {
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
<div class="m-1 p-1" class:bg-secondary={index % 2 !== 0}>
  <div
    class="flex w-full cursor-pointer items-center gap-2"
    class:border-b={expanded.includes(material.id)}
    onclick={toggleExpand}
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
      <p class="whitespace-pre text-muted-foreground">
        {material.description}
      </p>

      <div class="flex flex-wrap justify-center space-y-2 pt-2">
        <h4 class="my-2 w-full border-b text-muted-foreground">Inventory</h4>
        {#if inventory.length === 0}
          <div class="text-sm text-muted-foreground italic">No inventory available</div>
        {:else}
          <div class="w-3/4 overflow-x-auto">
            <table class="my-6 w-full border-collapse">
              <thead>
                <tr class="border-b">
                  <th class="py-1 text-left text-xs text-muted-foreground">Name</th>
                  <th class="py-1 text-left text-xs text-muted-foreground">Type</th>
                  <th class="py-1 text-left text-xs text-muted-foreground">Manufacturer</th>
                  <th class="py-1 text-left text-xs text-muted-foreground">Batch</th>
                  <th class="py-1 text-left text-xs text-muted-foreground">Available</th>
                  <th class="py-1 text-left text-xs text-muted-foreground">Initial</th>
                  <th class="py-1 text-left text-xs text-muted-foreground">Predilution</th>
                  <th class="py-1 text-left text-xs text-muted-foreground">Link</th>
                  <th class="py-1 text-left text-xs text-muted-foreground">Created</th>
                </tr>
              </thead>

              <tbody class="divide-y">
                {#each inventory as inv}
                  <tr>
                    <td class="font-medium">
                      {inv.name ?? material.name}
                    </td>

                    <td class="font-medium">
                      {inv.type}
                    </td>

                    <td class="font-medium">
                      {inv.manufacturer ?? '-'}
                    </td>

                    <td class="font-mono text-xs font-medium">
                      {inv.batch_id ?? '-'}
                    </td>

                    <td class="font-medium">
                      {gf.format(inv.grams_available)}
                    </td>

                    <td class="font-medium">
                      {gf.format(inv.grams_initial)}
                    </td>

                    <td class="font-mono text-sm">
                      {#if inv.grams_material && inv.grams_solvent}
                        {pf.format(inv.grams_material / (inv.grams_solvent + inv.grams_material))}
                      {:else}
                        -
                      {/if}
                    </td>

                    <td>
                      {#if inv.link != null}
                        <!-- svelte-ignore a11y_consider_explicit_label -->
                        <Button
                          size="icon-sm"
                          variant="link"
                          title={inv.link}
                          onclick={() => openUrl(inv.link!!)}
                        >
                          <ExternalLink />
                        </Button>
                      {:else}
                        <span class="font-mono text-sm">-</span>
                      {/if}
                    </td>

                    <td class="font-mono text-sm">
                      {df.format(new Date(inv.created_at))}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
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

      {#if !editing}
        <div class="flex w-full justify-center py-2">
          <Button class="mx-auto" onclick={() => startEdit()}>
            <SquarePen />
          </Button>
        </div>
      {/if}
    </div>

    <!-- EDIT MATERIAL -->

    {#if editing}
      <div class="m-2 flex flex-wrap items-center justify-center gap-1 rounded-md border-t p-2">
        <h3 class="w-full text-center text-sm">Edit definition</h3>

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
            <Button size="icon-sm" variant="destructive" onclick={() => cancelEdit()}><X /></Button>
            <Button size="icon-sm" variant="destructive" onclick={() => deleteMaterial()}
              ><Trash /></Button
            >
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
