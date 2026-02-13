<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { initMaterials, materials } from '$lib/materials.svelte';
  import Materials from '$lib/Materials.svelte';
  import Formula from '$lib/Formula.svelte';
  import { check, Update } from '@tauri-apps/plugin-updater';
  import { relaunch } from '@tauri-apps/plugin-process';
  import { onMount } from 'svelte';
  import { Download, X } from '@lucide/svelte';
  import { pf } from '$lib/utils';
  import { initFormulae } from '$lib/formulae.svelte';

  let display: 'materials' | 'formulae' = $state(
    (localStorage.getItem('lastDisplay') as 'materials' | 'formulae') ?? 'materials'
  );

  function selectDisplay(value: 'materials' | 'formulae') {
    localStorage.setItem('lastDisplay', value);
    display = value;
  }

  let updateCheckDone = $state(false);
  let update: Update | null = $state(null);
  let updateAccepted = $state(false);
  let updateStatus = $state('Checking for updates...');

  async function executeUpdate() {
    let downloaded = 0;
    let contentLength = 0;

    if (!update) {
      return;
    }

    await update!!.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength!!;
          updateStatus = 'Downloading formulae version ' + update!!.version;
          break;
        case 'Progress':
          downloaded += event.data.chunkLength;
          updateStatus =
            'Downloading formulae version ' +
            update!!.version +
            ` (${pf.format(downloaded / contentLength)})`;
          break;
        case 'Finished':
          updateStatus = `Successfully updated, restarting`;
          break;
      }
    });

    await relaunch();
  }

  async function checkUpdate() {
    if (updateCheckDone) return;

    console.log('checking for updates');

    update = await check();

    if (!update) {
      updateStatus = 'Already at latest version ✓';
      setTimeout(() => {
        updateCheckDone = true;
      }, 3000);
      return;
    }

    console.log(`found update ${update.version} from ${update.date} with notes ${update.body}`);
  }

  onMount(async () => {
    checkUpdate();
    initMaterials();
    initFormulae();
  });
</script>

{#if !updateCheckDone}
  {#if update}
    {#if !updateAccepted}
      <div class="mx-auto w-fit">
        <p>A new update is available. Update to version {update.version}?</p>
        <div class="flex justify-center">
          <Button variant="ghost" size="icon-sm" onclick={async () => await executeUpdate()}>
            <Download />
          </Button>
          <Button variant="ghost" size="icon-sm" onclick={() => (updateCheckDone = true)}>
            <X />
          </Button>
        </div>
      </div>
    {:else}
      <div class="mx-auto w-fit">{updateStatus}</div>
    {/if}
  {:else}
    <div class="absolute p-4">{updateStatus}</div>
  {/if}
{/if}

<div class="space-y-6 p-6">
  <header class="col-span-4 flex justify-center gap-2">
    <Button
      variant={display === 'materials' ? 'default' : 'outline'}
      onclick={() => selectDisplay('materials')}>Materials</Button
    >
    <Button
      variant={display === 'formulae' ? 'default' : 'outline'}
      onclick={() => selectDisplay('formulae')}>Formulae</Button
    >
  </header>

  {#if display === 'materials'}
    <Materials
      materialsAbstract={materials.abstract}
      materials={materials.inventory}
      history={materials.historyD}
    />
  {:else}
    <Formula history={materials.historyF} />
  {/if}
</div>
