<script lang="ts">
  let { value = $bindable(), placeholder = '', rows = 10, oninput = undefined } = $props();
</script>

<textarea
  bind:value
  {oninput}
  {rows}
  {placeholder}
  class="flex h-64 w-full min-w-0 rounded-md border border-input bg-transparent px-3 pt-1.5 text-sm font-medium shadow-xs ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[1px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
></textarea>
