<!-- src/lib/components/Chart/StoryOverlay.svelte -->
<script>
  export let step;
</script>

<div class="story-overlay">
  <p class="story-text">{step.text}</p>
  <button class="next-button" on:click>Continue →</button>
</div>

<style>
  .story-overlay {
    position: fixed;
    top: 2rem;
    left: 2rem;
    max-width: 400px;
    background: rgba(20, 0, 20, 0.9);
    padding: 1.5rem;
    border-radius: 8px;
    color: var(--color-off-purple);
  }

  .next-button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>