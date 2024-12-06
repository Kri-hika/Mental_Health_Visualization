<!-- src/routes/+page.svelte -->
<script>
  import { fade } from 'svelte/transition';
  import MentalHealthViz from '$lib/components/MentalHealthViz.svelte';
  import DynamicTribeViz from '$lib/components/DynamicTribeViz.svelte';

  
  export let data;
  
  // State management for visualization flow
  let currentView = 'initial'; // 'initial', 'tribes', 'exploration'
  let userData = null;

  function handleInitialComplete(event) {
    console.log("Transitioning to explore view");
    userData = event.detail;
    currentView = 'tribes';
  }

  function handleTribesComplete() {
    currentView = 'explore';
  }

  function handleBackToTribes() {
    currentView = 'tribes';
  }
</script>

{#if currentView === 'initial'}
  <div class="viz-container" in:fade={{ duration: 500 }}>
    <MentalHealthViz 
      data={data.data} 
      on:complete={handleInitialComplete}
    />
  </div>
{:else if currentView === 'tribes' && userData}
  <div class="viz-container" in:fade={{ duration: 500 }}>
    <MentalHealthViz 
      data={data.data}
      {userData}
      showTribeView={true}
      on:complete={handleTribesComplete}
    />
    <button 
      class="explore-button"
      on:click={handleTribesComplete}
    >
      Explore Deeper Insights →
    </button>
  </div>
{:else if currentView === 'explore' && userData}
  <div class="viz-container" in:fade={{ duration: 500 }}>
    <DynamicTribeViz
      data={data.data}
      treatmentData={data.treatmentData}
      {userData}
    />
    <button 
      class="back-button"
      on:click={handleBackToTribes}
    >
      ← Back to Tribes
    </button>
  </div>
{/if}

<style>
  .viz-container {
    width: 100%;
    height: 100vh;
    position: relative;
    background: var(--color-dark-purple);
  }

  .explore-button,
  .back-button {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
  }

  .explore-button:hover,
  .back-button:hover {
    transform: translateX(-50%) translateY(-2px);
    box-shadow: 0 4px 12px rgba(157, 78, 221, 0.3);
  }

  .back-button {
    background: transparent;
    color: var(--color-bright-purple);
    border: 2px solid var(--color-bright-purple);
  }
</style>

<userStyle>Normal</userStyle>