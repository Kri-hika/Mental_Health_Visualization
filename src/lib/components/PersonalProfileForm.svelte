<!-- src/lib/components/PersonalProfileForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  const dispatch = createEventDispatcher();
  
  let currentStep = 0;
  let formData = {
    age: '',
    workHours: '',
    sleepHours: '',
    stressLevel: ''
  };

  const steps = [
    {
      field: 'age',
      question: 'How old are you?',
      type: 'number',
      min: 18,
      max: 100,
      placeholder: 'Enter your age'
    },
    {
      field: 'workHours',
      question: 'How many hours do you work per week?',
      type: 'number',
      min: 0,
      max: 100,
      placeholder: 'Enter work hours'
    },
    {
      field: 'sleepHours',
      question: 'How many hours do you sleep per night?',
      type: 'number',
      min: 0,
      max: 24,
      placeholder: 'Enter sleep hours'
    },
    {
      field: 'stressLevel',
      question: 'How would you rate your stress level?',
      type: 'select',
      options: ['Low', 'Medium', 'High']
    }
  ];

  function handleNext() {
    if (currentStep < steps.length - 1) {
      currentStep++;
    } else {
      dispatch('complete', formData);
    }
  }

  function handleBack() {
    if (currentStep > 0) currentStep--;
  }

  $: currentField = steps[currentStep].field;
  $: isValid = formData[currentField] !== '';
</script>

<div class="form-container" in:fade={{ duration: 800 }}>
  <div class="progress-bar">
    {#each steps as _, i}
      <div class="progress-dot" class:active={i <= currentStep}></div>
    {/each}
  </div>

  <div class="question-container">
    {#key currentStep}
      <div class="question" 
        in:fly={{ y: 50, duration: 500, delay: 200 }} 
        out:fly={{ y: -50, duration: 500 }}>
        <h2>{steps[currentStep].question}</h2>
        
        {#if steps[currentStep].type === 'select'}
          <select 
            bind:value={formData[currentField]}
            class="input-field">
            <option value="">Select stress level</option>
            {#each steps[currentStep].options as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        {:else}
          <input
            type={steps[currentStep].type}
            min={steps[currentStep].min}
            max={steps[currentStep].max}
            bind:value={formData[currentField]}
            placeholder={steps[currentStep].placeholder}
            class="input-field"
          />
        {/if}
      </div>
    {/key}
  </div>

  <div class="button-container">
    {#if currentStep > 0}
      <button class="back-btn" on:click={handleBack}>
        ← Back
      </button>
    {/if}
    <button 
      class="next-btn" 
      on:click={handleNext}
      disabled={!isValid}>
      {currentStep === steps.length - 1 ? 'Find My Tribe' : 'Next →'}
    </button>
  </div>
</div>

<style>
  .form-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 2rem;
    background: rgba(20, 0, 40, 0.8);
    border-radius: 1rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
  }

  .progress-bar {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .progress-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(139, 92, 246, 0.2);
    transition: all 0.3s ease;
  }

  .progress-dot.active {
    background: var(--color-bright-purple);
    transform: scale(1.2);
  }

  .question-container {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .question {
    width: 100%;
    text-align: center;
  }

  h2 {
    color: var(--color-bright-purple);
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }

  .input-field {
    width: 100%;
    padding: 1rem;
    border: 2px solid rgba(139, 92, 246, 0.2);
    border-radius: 0.5rem;
    background: rgba(20, 0, 40, 0.5);
    color: var(--color-bright-purple);
    font-size: 1.125rem;
    transition: all 0.3s ease;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--color-bright-purple);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  .button-container {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .next-btn {
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
  }

  .next-btn:hover:not(:disabled) {
    transform: translateX(2px);
    background: rgba(139, 92, 246, 0.9);
  }

  .next-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .back-btn {
    background: transparent;
    color: var(--color-bright-purple);
    border: 2px solid var(--color-bright-purple);
  }

  .back-btn:hover {
    transform: translateX(-2px);
    background: rgba(139, 92, 246, 0.1);
  }
</style>