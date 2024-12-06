<!-- src/lib/components/MentalHealthViz.svelte -->
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { fade, fly } from 'svelte/transition';
  import DynamicCluster from './Chart/DynamicCluster.svelte';
  import PersonalProfileForm from './PersonalProfileForm.svelte';
  import TribeVisualization from './TribeVisualization.svelte';
  import DynamicTribeViz from './DynamicTribeViz.svelte';
  import DimensionControls from './DimensionControls.svelte';
  import InsightPanel from './InsightPanel.svelte';
  import MentalHealthExplorer from './MentalHealthExplorer.svelte';
  
  export let data;
  let vizComponent;
  let currentStep = 'clusters'; // 'clusters', 'form', 'tribes', or 'explore'
  let isTransitioning = false;
  let currentStoryIndex = 0;
  let userData = null;
  let currentDimension = 'clusters';

  $: {
    console.log('Current step:', currentStep);
    console.log('User data:', userData);
  }
  
  const storyStates = [
    {
      id: 'gather',
      title: 'Mental Health in Tech',
      description: 'Our dataset includes 1000 tech professionals across different roles. Each point represents an individual, their occupation, and mental health status.',
      layout: 'gather'
    },
    {
      id: 'occupation',
      title: 'Professional Distribution',
      description: 'Breakdown by occupation reveals varying mental health patterns across different roles in the tech industry.',
      layout: 'byOccupation'
    },
    {
      id: 'conditions',
      title: 'Mental Health Distribution',
      description: 'Overall, 51.5% of professionals reported having mental health conditions, with variations across different roles.',
      layout: 'byCondition'
    }
  ];

  $: currentState = storyStates[currentStoryIndex];
  
  async function handleStoryProgress() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    if (currentStoryIndex === storyStates.length - 1) {
      console.log("Moving to form step");
      currentStep = 'form';
      isTransitioning = false;
    } else {
      const nextIndex = currentStoryIndex + 1;
      try {
        await vizComponent.updateLayout(storyStates[nextIndex].layout);
        currentStoryIndex = nextIndex;
      } finally {
        isTransitioning = false;
      }
    }
  }

  function handleProfileComplete(event) {
    console.log("Profile completed with data:", event.detail);
    userData = event.detail;
    setTimeout(() => {
      console.log("Setting step to tribes");
      currentStep = 'tribes';
    }, 0);
  }

  function handleTribeExplore() {
    currentStep = 'explore';
  }

  onMount(() => {
    console.log("MentalHealthViz mounted");
    if (vizComponent) {
      vizComponent.updateLayout(currentState.layout);
    }
  });
</script>

{#if currentStep === 'clusters'}
  <div class="viz-wrapper" in:fade={{duration: 500}}>
    <DynamicCluster
      {data}
      bind:this={vizComponent}
      layout={currentState.layout}
    >
      <div 
        slot="story-content" 
        class="story-content"
        class:transitioning={isTransitioning}
      >
        <h2>{currentState.title}</h2>
        <p>{currentState.description}</p>
        <button 
          on:click={handleStoryProgress}
          disabled={isTransitioning}
          class:transitioning={isTransitioning}
        >
          {isTransitioning ? 'Transitioning...' : 'Continue →'}
        </button>
      </div>
    </DynamicCluster>
  </div>
{:else if currentStep === 'form'}
  <div class="form-wrapper" in:fade={{duration: 500}}>
    <div class="form-content">
      <h2>Find Your Mental Health Tribe</h2>
      <p>Share a few details about yourself to see where you fit in the bigger picture.</p>
      <PersonalProfileForm 
        on:complete={handleProfileComplete} 
      />
    </div>
  </div>
{:else if currentStep === 'tribes' && userData !== null}
  <div class="tribe-wrapper" in:fade={{duration: 500}}>
    <TribeVisualization 
    data={data} 
    {userData}
    on:complete={() => {
      dispatch('complete');
    }}
  />
    <button 
      class="explore-deeper-btn"
      on:click={handleTribeExplore}
    >
      Explore Deeper Insights →
    </button>
  </div>
{:else if currentStep === 'explore' && userData !== null}
  <div class="explore-wrapper" in:fade={{duration: 500}}>
    <DynamicTribeViz
      {data}
      {userData}
      {currentDimension}
    />
    <DimensionControls
      {currentDimension}
      on:change={(e) => currentDimension = e.detail}
    />
    <InsightPanel
      processedData={data}
      {userData}
      dimension={currentDimension}
    />
  </div>
{/if}

<style>
  .viz-wrapper, .form-wrapper, .tribe-wrapper, .explore-wrapper {
    width: 100%;
    height: 100vh;
    position: relative;
    background: var(--color-dark-purple);
  }

  .form-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .form-content {
    text-align: center;
    max-width: 600px;
  }

  h2 {
    color: var(--color-bright-purple);
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  p {
    color: var(--color-off-purple);
    font-size: 1.125rem;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .explore-deeper-btn {
    position: absolute;
    bottom: 2rem;
    right: 2rem;
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
  }

  .explore-deeper-btn:hover {
    transform: translateX(4px);
    background: var(--color-off-purple);
  }

  :global(.story-content) {
    color: var(--color-off-purple);
    max-width: 280px;
    transition: opacity 0.3s ease;
  }

  :global(.story-content.transitioning) {
    opacity: 0.7;
  }

  :global(.story-content button) {
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
    border: none;
    padding: 0.625rem 1.25rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  :global(.story-content button:disabled) {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>