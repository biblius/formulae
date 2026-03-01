<script lang="ts">
  import * as Dialog from './components/ui/dialog';
  import { ExternalLink, Plus, SquarePen, Trash, Undo } from '@lucide/svelte';
  import type { Material, MaterialAbstract, MaterialInstanceBuilder } from './types';
  import { df, gf, pf, toDateValue } from './utils';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import Button, { buttonVariants } from './components/ui/button/button.svelte';
  import AddMaterial from './AddMaterial.svelte';
  import {
    deleteMaterial,
    materials,
    undoDilution,
    updateMaterialInstance
  } from './data/materials.svelte';
  import MaterialInstanceManage from './MaterialInstanceManage.svelte';
  import { parseDateTime } from '@internationalized/date';

  let { definitions }: { definitions: MaterialAbstract[] } = $props();

  let editState: { id: number; builder: MaterialInstanceBuilder } | null = $state(null);

  async function editMaterialInstance() {
    if (editState == null) {
      console.warn('edit state is null!');
      return;
    }

    if (editState.builder.grams <= 0) {
      console.warn('invalid grams!', editState.builder.grams);
      return;
    }

    await updateMaterialInstance(editState.id, editState.builder);

    editState.builder.reset();

    editState = null;
  }

  function startEdit(instance: Material) {
    let predilution: number | undefined = undefined;

    if (instance.grams_material != null && instance.grams_solvent != null) {
      predilution =
        (instance.grams_material / (instance.grams_material + instance.grams_solvent)) * 100;
    }

    editState = {
      id: instance.id,
      builder: {
        name: instance.name,
        manufacturer: instance.manufacturer,
        batchId: instance.batch_id,
        grams: instance.grams_available,
        link: instance.link,
        predilution,
        createdAt: parseDateTime(toDateValue(instance.created_at)),

        reset() {
          this.name = instance.name;
          this.manufacturer = instance.manufacturer;
          this.batchId = instance.batch_id;
          this.grams = instance.grams_available;
          this.link = instance.link;
          this.predilution = predilution;
          this.createdAt = parseDateTime(toDateValue(instance.created_at));
        }
      }
    };
  }

  let deleteDialogOpen: number | null = $state(null);
  let undoDialogOpen: number | null = $state(null);
</script>

<div class="m-2 flex flex-wrap justify-center space-y-2">
  <div class="w-full overflow-x-auto">
    <table class="my-6 w-full border-collapse">
      <thead>
        <tr class="bg-primary/10">
          <th class="p-2 text-left text-sm text-muted-foreground">Definition</th>
          <th class="p-2 text-left text-sm text-muted-foreground">Name</th>
          <th class="p-2 text-left text-sm text-muted-foreground">Available</th>
          <th class="p-2 text-left text-sm text-muted-foreground">Type</th>
          <th class="p-2 text-left text-sm text-muted-foreground">Manufacturer</th>
          <th class="p-2 text-left text-sm text-muted-foreground">Batch</th>
          <th class="p-2 text-left text-sm text-muted-foreground">Predilution</th>
          <th class="p-2 text-left text-sm text-muted-foreground">Link</th>
          <th class="p-2 text-left text-sm text-muted-foreground">Created</th>

          <!-- BUTTON PLACEHOLDERS -->

          <th class="p-2 text-left text-sm text-muted-foreground"></th>
          <th class="p-2 text-left text-sm text-muted-foreground"></th>
        </tr>
      </thead>
      <tbody class="divide-y">
        {#each definitions as material}
          {#each material.inventory as inventoryMaterial}
            <tr>
              <td class="max-w-sm min-w-20 p-2 font-medium wrap-anywhere">
                {material.name}
              </td>

              <td class="max-w-sm min-w-20 items-center gap-2 p-2 font-medium wrap-anywhere">
                {inventoryMaterial.name ?? 'Unnamed material'}
              </td>

              <td class="p-2 font-medium">
                {gf.format(inventoryMaterial.grams_available)}
              </td>

              <td class="p-2 font-medium">
                {inventoryMaterial.type}
              </td>

              <td class="p-2 font-medium">
                {inventoryMaterial.manufacturer ?? '-'}
              </td>

              <td class="p-2 font-mono text-xs font-medium">
                {inventoryMaterial.batch_id ?? '-'}
              </td>

              <td class="p-2 font-mono text-sm">
                {#if inventoryMaterial.grams_material && inventoryMaterial.grams_solvent}
                  {pf.format(
                    inventoryMaterial.grams_material /
                      (inventoryMaterial.grams_solvent + inventoryMaterial.grams_material)
                  )}
                {:else}
                  -
                {/if}
              </td>

              <td class="p-2 font-medium">
                {#if inventoryMaterial.link != null}
                  <Button
                    size="icon-sm"
                    variant="link"
                    title={inventoryMaterial.link}
                    onclick={() => openUrl(inventoryMaterial.link!!)}
                  >
                    <ExternalLink />
                  </Button>
                {:else}
                  <span class="font-mono text-sm">-</span>
                {/if}
              </td>

              <td class="p-2 font-mono text-sm">
                {df.format(new Date(inventoryMaterial.created_at))}
              </td>

              <td class="p-2 font-mono text-sm">
                {#if inventoryMaterial.grams_material != null && materials.isDilutionTarget(inventoryMaterial.id)}
                  <Dialog.Root
                    open={undoDialogOpen === inventoryMaterial.id}
                    onOpenChange={(open) => (undoDialogOpen = open ? inventoryMaterial.id : null)}
                  >
                    <Dialog.Trigger>
                      <Button size="icon-sm" variant="ghost" class="hover:text-destructive"
                        ><Undo /></Button
                      >
                    </Dialog.Trigger>
                    <Dialog.Content>
                      <Dialog.Header>
                        <Dialog.Title
                          >Undo dilution {inventoryMaterial.name ??
                            'Unnamed material'}?</Dialog.Title
                        >
                        <Dialog.Description
                          >This will delete the dilution and restore the material used to create it.
                          This action cannot be undone.</Dialog.Description
                        >
                      </Dialog.Header>

                      <Dialog.Footer>
                        <Dialog.Close class={buttonVariants({ variant: 'default' })}
                          >Cancel</Dialog.Close
                        >
                        <Button
                          type="submit"
                          variant="destructive"
                          onclick={() => {
                            undoDilution(inventoryMaterial.id);
                            undoDialogOpen = null;
                          }}>Undo</Button
                        >
                      </Dialog.Footer>
                    </Dialog.Content>
                  </Dialog.Root>

                  <!-- EDIT BUTTON -->
                {:else if !materials.isDilutionTarget(inventoryMaterial.id)}
                  <Button variant={'ghost'} onclick={() => startEdit(inventoryMaterial)}>
                    <SquarePen />
                  </Button>
                {/if}
              </td>

              <!-- DELETE BUTTON -->

              <td class="p-2 font-mono text-sm">
                <Dialog.Root
                  open={deleteDialogOpen === inventoryMaterial.id}
                  onOpenChange={(open) => (deleteDialogOpen = open ? inventoryMaterial.id : null)}
                >
                  <Dialog.Trigger>
                    <Button size="icon-sm" variant="ghost" class="hover:text-destructive"
                      ><Trash /></Button
                    >
                  </Dialog.Trigger>
                  <Dialog.Content>
                    <Dialog.Header>
                      <Dialog.Title
                        >Delete {inventoryMaterial.name ?? 'Unnamed material'}?</Dialog.Title
                      >
                      <Dialog.Description>This action cannot be undone.</Dialog.Description>
                    </Dialog.Header>

                    <Dialog.Footer>
                      <Dialog.Close class={buttonVariants({ variant: 'default' })}
                        >Cancel</Dialog.Close
                      >
                      <Button
                        type="submit"
                        variant="destructive"
                        onclick={() => {
                          deleteMaterial(inventoryMaterial.id);
                          deleteDialogOpen = null;
                        }}>Delete</Button
                      >
                    </Dialog.Footer>
                  </Dialog.Content>
                </Dialog.Root>
              </td>
            </tr>

            {#if editState != null && editState.id === inventoryMaterial.id}
              <tr class="w-full justify-center">
                <td colspan="9" class="w-full text-center">
                  <div class="flex w-full justify-center">
                    <MaterialInstanceManage
                      bind:state={editState.builder}
                      {material}
                      onSubmit={editMaterialInstance}
                      onCancel={() => {
                        editState?.builder.reset();
                        editState = null;
                      }}
                    />
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        {/each}
      </tbody>
    </table>
  </div>
</div>
