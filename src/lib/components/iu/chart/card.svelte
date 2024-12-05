<!-- src/lib/components/ui/card.svelte -->
<script lang="ts">
  let className: string = '';
  export { className as class };
</script>

<div class={`rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 ${className}`}>
  <slot />
</div>

<!-- CardHeader -->
<script context="module" lang="ts">
  export function CardHeader({ className = '', ...props }) {
    return (
      <div
        class={`flex flex-col space-y-1.5 p-6 ${className}`}
        {...props}
      />
    )
  }
</script>

<!-- CardContent -->
<script context="module" lang="ts">
  export function CardContent({ className = '', ...props }) {
    return (
      <div class={`p-6 pt-0 ${className}`} {...props} />
    )
  }
</script>

<!-- CardTitle -->
<script context="module" lang="ts">
  export function CardTitle({ className = '', ...props }) {
    return (
      <h3
        class={`text-2xl font-semibold leading-none tracking-tight ${className}`}
        {...props}
      />
    )
  }
</script>