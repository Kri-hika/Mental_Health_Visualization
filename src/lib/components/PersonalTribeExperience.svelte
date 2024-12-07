<!-- src/lib/components/PersonalTribeExperience.svelte -->
<script>
  import { fade, fly } from 'svelte/transition';
  import PersonalProfileForm from './PersonalProfileForm.svelte';
  import TribeVisualization from './TribeVisualization.svelte';
  
  export let data;  // The main dataset
  
  let currentStep = 'form';  // 'form' or 'visualization'
  let userData = null;
  
  function handleProfileComplete(event) {
    userData = event.detail;
    currentStep = 'visualization';
  }
</script>

<div class="experience-container">
  {#if currentStep === 'form'}
    <div class="form-step" in:fade={{ duration: 800 }}>
      <div class="intro-text" in:fly={{ y: 50, duration: 800 }}>
        <h1>Find Your Mental Health Tribe</h1>
        <p>Share a few details about yourself, and we'll show you where you fit in the bigger picture of mental health in tech.</p>
      </div>
      <PersonalProfileForm on:complete={handleProfileComplete} />
    </div>
  {:else if currentStep === 'visualization' && userData}
    <div class="viz-step" in:fade={{ duration: 800 }}>
      <TribeVisualization {data} {userData} />
    </div>
  {/if}
</div>

<style>
  .experience-container {
    width: 100%;
    height: 100vh;
    background: var(--color-dark-purple);
    color: var(--color-off-purple);
    overflow: hidden;
  }

  .form-step {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .intro-text {
    text-align: center;
    margin-bottom: 3rem;
    max-width: 600px;
  }

  .intro-text h1 {
    color: var(--color-bright-purple);
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .intro-text p {
    font-size: 1.125rem;
    line-height: 1.6;
    opacity: 0.9;
  }

  .viz-step {
    height: 100%;
  }
</style>