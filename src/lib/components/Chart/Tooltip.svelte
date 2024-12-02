<!-- src/lib/components/Chart/Tooltip.svelte -->
<script>
  export let data;

  $: position = { x: 0, y: 0 };

  function updatePosition(event) {
    position = {
      x: event.clientX + 10,
      y: event.clientY + 10
    };
  }
</script>

<svelte:window on:mousemove={updatePosition}/>

<div 
  class="tooltip"
  style="left: {position.x}px; top: {position.y}px"
>
  <h3>{data.Occupation}</h3>
  <p>Age: {data.Age}</p>
  <p>Work Hours: {data.Work_Hours}h/week</p>
  <p>Sleep: {data.Sleep_Hours}h/day</p>
  <p>Mental Health: {data.Mental_Health_Condition}</p>
  <p>Stress Level: {data.Stress_Level}</p>
</div>

<style>
  .tooltip {
    position: fixed;
    background: rgba(20, 0, 20, 0.9);
    color: var(--color-off-purple);
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid var(--color-light-purple);
    pointer-events: none;
    z-index: 1000;
  }
</style>