<script>
  import '../styles/app.css';
  import { viewport, scrollY } from '$lib/stores';
</script>

<svelte:window bind:scrollY={$scrollY} />

<div class="app">
  <main>
    <slot />
  </main>
</div>

<style>
  .app {
    min-height: 100vh;
    background-color: var(--color-bg);
  }
  
  main {
    position: relative;
    width: 100%;
  }
</style>