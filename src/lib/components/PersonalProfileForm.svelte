<!-- src/lib/components/PersonalProfileForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  const dispatch = createEventDispatcher();
  
  let currentStep = 0;
  let formData = {
    age: 30,         // Default values
    workHours: 40,
    sleepHours: 7,
    stressLevel: ''
  };

  const steps = [
    {
      field: 'age',
      question: 'How old are you?',
      type: 'range',
      min: 18,
      max: 80,
      defaultValue: 30,
      helpText: 'Use the slider to select your age'
    },
    {
      field: 'workHours',
      question: 'How many hours do you work per week?',
      type: 'range',
      min: 20,
      max: 80,
      defaultValue: 40,
      helpText: 'Include overtime and side projects'
    },
    {
      field: 'sleepHours',
      question: 'How many hours do you sleep per night?',
      type: 'range',
      min: 3,
      max: 12,
      step: 0.5,
      defaultValue: 7,
      helpText: 'Average over the past month'
    },
    {
      field: 'stressLevel',
      question: 'How would you rate your stress level?',
      type: 'buttons',
      options: ['Low', 'Medium', 'High'],
      helpText: 'Your overall stress level'
    }
  ];

  function handleNext() {
    console.log("Current step:", currentStep, "Form data:", formData);
    
    if (currentStep < steps.length - 1) {
      currentStep++;
    } else {
      console.log("Form completed, dispatching data:", formData);
      dispatch('complete', formData);
    }
  }

  function handleBack() {
    if (currentStep > 0) currentStep--;
  }

  $: currentField = steps[currentStep].field;
  $: progress = ((currentStep + 1) / steps.length) * 100;
</script>

<div class="form-container">
  <div class="progress-bar">
    <div class="progress" style="width: {progress}%"></div>
  </div>

  <div class="question-container">
    <h3>{steps[currentStep].question}</h3>
    <p class="help-text">{steps[currentStep].helpText}</p>

    {#if steps[currentStep].type === 'range'}
      <div class="range-container">
        <input
          type="range"
          min={steps[currentStep].min}
          max={steps[currentStep].max}
          step={steps[currentStep].step || 1}
          bind:value={formData[currentField]}
        />
        <div class="value-display">
          {formData[currentField]} {currentField === 'workHours' ? 'hours/week' : 
                                  currentField === 'sleepHours' ? 'hours/night' : 
                                  'years'}
        </div>
      </div>
    {:else if steps[currentStep].type === 'buttons'}
      <div class="button-group">
        {#each steps[currentStep].options as option}
          <button
            class="option-button"
            class:selected={formData[currentField] === option}
            on:click={() => formData[currentField] = option}
          >
            {option}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="navigation">
    {#if currentStep > 0}
      <button class="nav-button back" on:click={handleBack}>Back</button>
    {/if}
    <button 
      class="nav-button next" 
      on:click={handleNext}
      disabled={!formData[currentField]}
    >
      {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
    </button>
  </div>
</div>

<style>
  .form-container {
    background: rgba(20, 0, 40, 0.9);
    padding: 2rem;
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
  }

  .progress-bar {
    height: 4px;
    background: rgba(139, 92, 246, 0.2);
    margin-bottom: 2rem;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress {
    height: 100%;
    background: var(--color-bright-purple);
    transition: width 0.3s ease;
  }

  .question-container {
    text-align: center;
    margin-bottom: 2rem;
  }

  h3 {
    color: var(--color-bright-purple);
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .help-text {
    color: var(--color-off-purple);
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .range-container {
    padding: 1rem 0;
  }

  input[type="range"] {
    width: 100%;
    margin-bottom: 1rem;
  }

  .value-display {
    color: var(--color-bright-purple);
    font-size: 1.25rem;
    font-weight: 500;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .option-button {
    padding: 1rem 2rem;
    border: 2px solid var(--color-bright-purple);
    background: transparent;
    color: var(--color-bright-purple);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .option-button.selected {
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
  }

  .navigation {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .nav-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .next {
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
  }

  .back {
    background: transparent;
    color: var(--color-bright-purple);
    border: 2px solid var(--color-bright-purple);
  }

  .nav-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>