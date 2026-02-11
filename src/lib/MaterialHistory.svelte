<script lang="ts">
  import { formulae } from './formulae.svelte';
  import { listMaterialHistory, materials, type MaterialTargetType } from './materials.svelte';
  import { gf } from './utils';

  let { type }: { type: MaterialTargetType } = $props();

  function target() {
    if (type === 'DILUTION') {
      return materials;
    } else {
      return formulae;
    }
  }

  function getMaterialName(id: number) {
    return materials.get(id)!!.name ?? materials.getAbstract(materials.get(id)!!.id)?.name;
  }
</script>

{#await listMaterialHistory(type) then history}
  <div class="max-h-80 space-y-6 overflow-scroll p-2">
    {#each Object.entries(history) as [targetId, entries]}
      <details class="mx-auto w-1/2 rounded-sm border">
        <summary
          class="flex cursor-pointer list-none items-baseline justify-between border-b p-4 font-semibold"
        >
          <span>
            {target().get(parseInt(targetId))?.name}
          </span>
          <span class="text-sm font-normal">
            {entries.length} materials used
          </span>
          <span class="text-sm font-normal">
            {target().get(parseInt(targetId))?.created_at}
          </span>
        </summary>

        <div class="overflow-x-auto">
          <table class="mx-auto w-1/2 border-collapse text-sm">
            <thead>
              <tr>
                <th class="border-b p-3 text-left font-semibold"> Material </th>
                <th class="border-b p-3 text-right font-semibold"> Amount </th>
              </tr>
            </thead>

            <tbody>
              {#each entries as entry}
                <tr>
                  <td class="border-b p-3">
                    {getMaterialName(entry.material_id)}
                  </td>
                  <td class="border-b p-3 text-right font-mono">
                    {gf.format(entry.grams)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </details>
    {/each}
  </div>
{/await}
