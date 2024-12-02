<script>
  import { fade, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { focusTrap } from '$lib/actions';
  import { mq } from '$lib/stores';

  export let currentStage;
  export let question;
  export let options;

  let selected = null;
</script>

<div
  class="question"
  class:longform={currentStage === 'explore'}
  use:focusTrap
>
  <div 
    class="text"
    in:fade={{ duration: 400, delay: 200 }}
    out:fade={{ duration: 200 }}
  >
    <p class="kicker">{question.kicker}</p>
    {@html question.text}
  </div>

  <div 
    class="answers"
    class:stage_explore={currentStage === 'explore'}
    in:slide={{ duration: 400, delay: 400, easing: quintOut }}
  >
    {#if Array.isArray(options)}
      {#each options as option}
        <button
          class="answerItem"
          class:selected={selected === option.value}
          on:click={() => selected = option.value}
        >
          {option.label}
        </button>
      {/each}
    {:else}
      <button 
        class="answerButton"
        on:click
      >
        Continue <span>⏎</span>
      </button>
    {/if}
  </div>
</div>