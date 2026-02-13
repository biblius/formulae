<script lang="ts">
  import { formulae } from './data/formulae.svelte';
  import { materials, type HistoryEntry, type MaterialTargetType } from './data/materials.svelte';
  import { df, gf } from './utils';

  let { history }: { history: HistoryEntry<MaterialTargetType>[] } = $props();

  function target(id: number, type: MaterialTargetType) {
    if (type === 'DILUTION') {
      return materials.get(id);
    } else {
      return formulae.get(id);
    }
  }

  function getMaterialName(id: number) {
    return materials.get(id)!!.name ?? materials.getAbstract(materials.get(id)!!.id)?.name;
  }
</script>

<div class="space-y-6 overflow-y-scroll p-2">
  {#each history as entry}
    <details class="mx-auto my-1 w-2/3 rounded-sm border">
      <summary
        class="flex cursor-pointer list-none items-baseline justify-between border-b px-4 py-2 font-semibold"
      >
        <span>
          Created {target(entry.target_id, entry.target)?.name}
        </span>
        <span class="text-sm font-normal not-sm:hidden">
          {entry.materials.length}
          {#if entry.materials.length === 1}
            material
          {:else}
            materials
          {/if}
          used for {entry.target.toLowerCase()}
        </span>
        <span class="text-sm font-normal not-sm:hidden">
          {df.format(new Date(target(entry.target_id, entry.target)!!.created_at))}
        </span>
      </summary>

      <div>
        <table class="mx-auto w-1/2 border-collapse text-sm">
          <thead>
            <tr>
              <th class="border-b p-3 text-left font-semibold"> Material </th>
              <th class="border-b p-3 text-right font-semibold"> Amount </th>
            </tr>
          </thead>

          <tbody>
            {#each entry.materials as material}
              <tr>
                <td class="border-b p-3">
                  {getMaterialName(material.id)}
                </td>
                <td class="border-b p-3 text-right font-mono">
                  {gf.format(material.grams)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/each}
</div>
