<script lang="ts">
  import * as DropdownMenu from './components/ui/dropdown-menu/index';
  import { Button } from '$lib/components/ui/button';
  import {
    THEMES,
    applyTheme,
    THEME_AMBER,
    THEME_AMBER_LIGHT,
    THEME_CAFFEINE,
    THEME_CAFFEINE_LIGHT
  } from './theme';
  import { Cog } from '@lucide/svelte';
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="max-w-lg">
    <Button size="icon-sm" variant="outline">
      <Cog />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="max-h-80 min-h-0 overflow-y-scroll">
    <div class="p-2">
      <Input
        type="search"
        placeholder="Search inventory"
        bind:value={searching}
        onselect={(e) => e.preventDefault()}
      />
    </div>
    {#each materialsDisplay() as material}
      <DropdownMenu.Item
        onclick={() => addToFormula(material)}
        disabled={material.grams_available <= 0}
        class="flex"
      >
        <p class="flex-1">{material.name}</p>
        <p>
          {gf.format(material.grams_available)}
        </p>
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
<!-- <ModeWatcher /> -->

<Tooltip.Provider>
  {@render children()}
</Tooltip.Provider>
