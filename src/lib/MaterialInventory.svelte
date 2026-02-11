<script lang="ts">
  import * as Dialog from './components/ui/dialog';
  import { ExternalLink, Plus, Trash } from '@lucide/svelte';

  import type { MaterialAbstract, Material } from './types';
  import { df, gf, pf } from './utils';
  import { openUrl } from '@tauri-apps/plugin-opener';
  import Button, { buttonVariants } from './components/ui/button/button.svelte';
  import AddMaterial from './AddMaterial.svelte';
  import { deleteMaterial } from './materials.svelte';

  let {
    material,
    inventory
  }: {
    material: MaterialAbstract;
    inventory: Material[];
  } = $props();

  let adding = $state(false);

  async function removeMaterial(id: number) {
    await deleteMaterial(id);
  }
</script>

<div class="flex flex-wrap justify-center space-y-2 pt-2">
  <h4 class="my-2 w-full border-b text-muted-foreground">Inventory</h4>
  {#if inventory.length === 0}
    <div class="text-sm text-muted-foreground italic">No inventory available</div>
  {:else}
    <div class="w-3/4 overflow-x-auto">
      <table class="my-6 w-full border-collapse">
        <thead>
          <tr class="bg-primary/10">
            <th class="p-3 text-left text-xs text-muted-foreground">Name</th>
            <th class="p-3 text-left text-xs text-muted-foreground">Type</th>
            <th class="p-3 text-left text-xs text-muted-foreground">Manufacturer</th>
            <th class="p-3 text-left text-xs text-muted-foreground">Batch</th>
            <th class="p-3 text-left text-xs text-muted-foreground">Available</th>
            <th class="p-3 text-left text-xs text-muted-foreground">Initial</th>
            <th class="p-3 text-left text-xs text-muted-foreground">Predilution</th>
            <th class="p-3 text-left text-xs text-muted-foreground">Link</th>
            <th class="p-3 text-left text-xs text-muted-foreground">Created</th>
          </tr>
        </thead>

        <tbody class="divide-y">
          {#each inventory as inventoryMaterial}
            <tr class="relative hover:bg-muted/50">
              <td class="p-2 font-medium">
                {inventoryMaterial.name ?? material.name}
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

              <td class="p-2 font-medium">
                {gf.format(inventoryMaterial.grams_available)}
              </td>

              <td class="p-2 font-medium">
                {gf.format(inventoryMaterial.grams_initial)}
              </td>

              <td class="font-mono text-sm">
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

              <td class="absolute translate-y-1">
                <Dialog.Root>
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
                        onclick={() => removeMaterial(inventoryMaterial.id)}>Delete</Button
                      >
                    </Dialog.Footer>
                  </Dialog.Content>
                </Dialog.Root>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div class="flex w-full justify-center">
    <Button variant={adding ? 'default' : 'outline'} onclick={() => (adding = !adding)}
      ><Plus /></Button
    >
  </div>

  {#if adding}
    <AddMaterial onSubmit={() => (adding = false)} {material} {inventory} />
  {/if}
</div>
