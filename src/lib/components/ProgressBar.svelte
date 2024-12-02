<!-- src/lib/components/ProgressBar.svelte -->
<script>
  export let progress = 0;
</script>

<div class="progress-container">
  <div 
    class="progress-bar"
    style="width: {progress}%"
  ></div>
</div>

<style>
  .progress-container {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--color-dark-purple);
    z-index: var(--z-overlay);
  }

  .progress-bar {
    height: 100%;
    background: var(--color-bright-purple);
    transition: width 400ms cubic-bezier(0.25, 0.1, 0.25, 1);
  }
</style>