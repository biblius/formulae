<script lang="ts">
  import { Check, X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { formulae, insertFormulaNote } from './formula.svelte';
  import { materials } from './materials.svelte';
  import { gf, pf } from './utils';
  import FormulaNote from './FormulaNote.svelte';

  let openId = $state<number | null>(null);

  // per-formula UI state
  let addingNoteFor = $state<Set<number>>(new Set());
  let noteDrafts = $state<Record<number, string>>({});

  function toggle(id: number) {
    openId = openId === id ? null : id;
  }

  function startAddNote(id: number) {
    addingNoteFor.add(id);
    addingNoteFor = new Set(addingNoteFor);
  }

  function cancelAddNote(id: number) {
    addingNoteFor.delete(id);
    addingNoteFor = new Set(addingNoteFor);
    delete noteDrafts[id];
  }

  async function saveNote(id: number) {
    const content = noteDrafts[id]?.trim();

    if (!content) return;

    await insertFormulaNote(id, content);

    cancelAddNote(id);
  }
</script>

<ul class="divide-y rounded-md border">
  {#each formulae.formulae as formula}
    <li>
      <!-- HEADER -->

      <button
        class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
        onclick={() => toggle(formula.id)}
      >
        <div>
          <div class="font-medium">{formula.name}</div>
          {#if formula.description}
            <div class="text-sm text-muted-foreground">
              {formula.description}
            </div>
          {/if}
        </div>

        <div class="text-sm whitespace-nowrap text-muted-foreground">
          {formula.grams_total} g ({formula.materials.length} materials)
        </div>
      </button>

      {#if openId === formula.id}
        <div class="">
          <div class="m-2 w-full">
            <table class="mx-auto w-2/3 border-collapse text-sm">
              <!-- HEADER -->

              <thead>
                <tr class="border text-muted-foreground">
                  <th class="p-2 pr-2 font-medium">Material</th>
                  <th class="p-2 pr-2 font-medium">Type</th>
                  <th class="p-2 pr-2 font-medium">Amount</th>
                  <th class="p-2 pr-2 font-medium">% material</th>
                  <th class="p-2 pr-2 font-medium">% total</th>
                </tr>
              </thead>

              <!-- BODY -->

              <tbody>
                {#each formula.materials as material}
                  <tr class="border">
                    <td class="p-2 pr-2">{materials.get(material.material_id)?.name}</td>
                    <td class="p-2 pr-2">{materials.get(material.material_id)?.type}</td>
                    <td class="p-2 pr-2 tabular-nums">
                      {gf.format(material.grams)}
                    </td>
                    <td class="p-2 pr-2"
                      >{pf.format(
                        material.grams / formula.materials.reduce((acc, m) => acc + m.grams, 0)
                      )}</td
                    >
                    <td class="p-2 pr-2">{pf.format(material.grams / formula.grams_total)}</td>
                  </tr>
                {/each}

                <tr class="border-b text-muted-foreground">
                  <td class="p-2">Solvent</td>
                  <td class="p-2">-</td>
                  <td class="p-2"
                    >{gf.format(
                      formula.grams_total - formula.materials.reduce((acc, m) => acc + m.grams, 0)
                    )}</td
                  >
                  <td class="p-2">-</td>
                  <td class="p-2"
                    >{pf.format(
                      (formula.grams_total -
                        formula.materials.reduce((acc, m) => acc + m.grams, 0)) /
                        formula.grams_total
                    )}</td
                  >
                </tr>
              </tbody>

              <!-- FOOTER -->

              <tfoot>
                <tr class="p-2 font-bold">
                  <td class="p-2 pr-2">Total</td>
                  <td class="p-2 pr-2">-</td>
                  <td class="p-2 pr-2 tabular-nums">
                    {gf.format(formula.grams_total)}
                  </td>
                  <td class="p-2 pr-2"
                    >{pf.format(
                      formula.materials.reduce((acc, m) => acc + m.grams, 0) / formula.grams_total
                    )}</td
                  >
                  <td class="p-2 pr-2">{pf.format(1)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Notes -->

          <div class="flex w-full flex-wrap justify-center text-sm">
            <div class="w-full text-center">
              <span class="text-muted-foreground">Notes</span>
            </div>

            <div class="max-auto max-h-96 min-h-0 w-2/3 overflow-scroll">
              {#each formula.notes as _, i}
                <FormulaNote bind:note={formula.notes[i]} />
              {/each}
            </div>

            {#if addingNoteFor.has(formula.id)}
              <div class="m-2 flex w-1/2 flex-wrap justify-center">
                <textarea
                  class="w-full resize-y rounded-md border p-2 text-sm"
                  rows="3"
                  placeholder="Write a note…"
                  bind:value={noteDrafts[formula.id]}
                ></textarea>

                <div class="flex gap-2 p-2">
                  <Button size="icon-sm" onclick={() => saveNote(formula.id)}><Check /></Button>
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    onclick={() => cancelAddNote(formula.id)}><X /></Button
                  >
                </div>
              </div>
            {/if}

            {#if !addingNoteFor.has(formula.id)}
              <div class="flex w-full justify-center">
                <Button
                  variant="ghost"
                  class="m-2 text-xs underline hover:text-foreground"
                  onclick={() => startAddNote(formula.id)}
                >
                  Add note
                </Button>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </li>
  {/each}
</ul>
