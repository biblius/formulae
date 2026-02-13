<script lang="ts">
  import { tick } from 'svelte';

  let {
    value = $bindable(),
    onSave,

    // Displayed when not editing
    display
  }: {
    value: number;
    onSave: (val: number) => void;
    display: any;
  } = $props();

  let editing = $state(false);
  let inputRef: HTMLInputElement | undefined = $state();

  let lastValue = 0;

  // Start editing
  function startEdit() {
    lastValue = value;
    editing = true;

    // Focus input after next tick
    tick().then(() => {
      inputRef!!.focus();
      inputRef!!.select();
    });
  }

  // Save changes
  function save() {
    try {
      onSave(value);
    } catch (e) {
      console.error('error while updating editable', e);
      value = lastValue;
    }

    editing = false;
  }

  // Cancel editing
  function cancel() {
    value = lastValue;
    editing = false;
  }

  function clickOutsideSave(node: HTMLElement) {
    const onPointerDown = (event: PointerEvent) => {
      if (!node.contains(event.target as Node)) {
        if (node === document.activeElement || node.contains(document.activeElement)) {
          if (editing) {
            save();
          }
        }
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);

    return {
      destroy() {
        document.removeEventListener('pointerdown', onPointerDown, true);
      }
    };
  }
</script>

{#if editing}
  <input
    class="mx-auto max-w-16"
    use:clickOutsideSave
    bind:this={inputRef}
    bind:value
    type="number"
    step="0.01"
    onkeydown={(e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') cancel();
    }}
  />
{:else}
  {@render display({ value, startEdit })}
{/if}
