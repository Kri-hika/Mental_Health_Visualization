<!-- src/lib/components/icons/PersonIcon.svelte -->
<script>
  export let size = 8;
  export let color = '#9D4EDD';
  export let isUser = false;
  export let wellbeing = 0.5;

  $: adjustedColor = adjustColorForWellbeing(color, wellbeing);

  function adjustColorForWellbeing(baseColor, wellbeing) {
    const hsl = d3.hsl(baseColor);
    // Adjust lightness based on wellbeing (keeping some minimum lightness)
    hsl.l = 0.3 + (wellbeing * 0.4);
    return hsl.toString();
  }
</script>

<svg 
  width={size * 2} 
  height={size * 2.5} 
  viewBox="0 0 24 30"
  class="person-icon"
  class:is-user={isUser}
>
  <!-- Head -->
  <circle 
    cx="12" 
    cy="7" 
    r="6" 
    fill={adjustedColor}
    stroke={isUser ? "#FFD700" : "none"}
    stroke-width={isUser ? "2" : "0"}
  />
  
  <!-- Body -->
  <path 
    d="M6 28c0-3.314 2.686-10 6-10s6 6.686 6 10"
    fill={adjustedColor}
    stroke={isUser ? "#FFD700" : "none"}
    stroke-width={isUser ? "2" : "0"}
  />

  <!-- Face details for user icon -->
  {#if isUser}
    <g class="face">
      <!-- Eyes -->
      <circle cx="10" cy="6" r="1" fill="#FFD700"/>
      <circle cx="14" cy="6" r="1" fill="#FFD700"/>
      <!-- Smile -->
      <path
        d="M10 9 Q12 11 14 9"
        stroke="#FFD700"
        fill="none"
        stroke-width="0.5"
      />
    </g>
  {/if}
</svg>

<style>
  .person-icon {
    opacity: 0.8;
    transition: all 0.3s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }

  .person-icon:hover {
    opacity: 1;
    transform: scale(1.2);
  }

  .is-user {
    opacity: 1;
    filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));
  }

  .face {
    transform-origin: center;
    animation: subtle-bounce 2s ease-in-out infinite;
  }

  @keyframes subtle-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(0.5px); }
  }
</style>