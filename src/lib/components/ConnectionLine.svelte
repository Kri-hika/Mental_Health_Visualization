<!-- src/lib/components/ConnectionLine.svelte -->
<script>
  import { draw } from 'svelte/transition';
  
  export let start = { x: 0, y: 0 };
  export let end = { x: 0, y: 0 };
  export let color = '#9D4EDD';
  export let active = false;
</script>

<svg class="connection-line" class:active>
  <path
    d={`M ${start.x} ${start.y} 
        C ${start.x} ${(start.y + end.y) / 2},
          ${end.x} ${(start.y + end.y) / 2},
          ${end.x} ${end.y}`}
    stroke={color}
    fill="none"
    transition:draw
  />
</svg>

<style>
  .connection-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .connection-line.active {
    opacity: 0.3;
  }

  path {
    stroke-width: 2;
    stroke-dasharray: 4 4;
  }
</style>