<script lang="ts">
  import * as DropdownMenu from './components/ui/dropdown-menu';
  import { Button } from '$lib/components/ui/button';
  import { THEMES, applyTheme, getTheme, getThemeDisplay } from './theme';
  import { Cog } from '@lucide/svelte';
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Button size="icon" variant="ghost">
      <Cog />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content side="bottom" class="">
    <DropdownMenu.Group>
      <DropdownMenu.Label>Theme</DropdownMenu.Label>
      <DropdownMenu.Separator />
      {#each THEMES as theme}
        <DropdownMenu.Item onclick={() => applyTheme(theme)} class="flex">
          {getThemeDisplay(theme)}
          {#if theme === getTheme()}
            ✓
          {/if}
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>
