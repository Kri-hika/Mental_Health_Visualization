<!-- src/lib/components/TribeVisualization.svelte -->
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import * as d3 from 'd3';
  import { fade } from 'svelte/transition';
  import _ from 'lodash';

  export let data; // Full dataset
  export let userData; // User's input data
  
  // Original data for existing visualizations
  const mentalHealthData = data.data;
  
  // Enhanced data for tribe visualization
  const { clusters, occupationStats } = data;

  let svg;
  let container;
  let width = 1000;
  let height = 700;
  let simulation;
  let userNode;
  let tribes = [];

  // Margins
  const margin = { top: 80, right: 100, bottom: 60, left: 100 };
  $: plotWidth = width - margin.left - margin.right;
  $: plotHeight = height - margin.top - margin.bottom;

  // Color scales for different attributes
  const colorScales = {
    age: d3.scaleSequential(d3.interpolateViridis).domain([18, 65]),
    stress: d3.scaleOrdinal()
      .domain(['Low', 'Medium', 'High'])
      .range(['#4facff', '#9d4edd', '#ff6b9c'])
  };

  function initializeSimulation() {
    if (!browser || !data) return;

    // Process and cluster the data
    tribes = processTribeData(data, userData);
    
    // Create user node
    userNode = {
      ...userData,
      tribe: findUserTribe(userData, tribes),
      isUser: true,
      r: 8  // Larger radius for user node
    };

    // Add user to visualization data
    const vizData = [...data, userNode];

    if (simulation) simulation.stop();

    simulation = d3.forceSimulation(vizData)
      .force('charge', d3.forceManyBody().strength(-50))
      .force('collide', d3.forceCollide().radius(d => d.isUser ? 12 : 6))
      .force('x', d3.forceX(d => getTribePosition(d.tribe).x).strength(0.5))
      .force('y', d3.forceY(d => getTribePosition(d.tribe).y).strength(0.5))
      .alpha(0.5)
      .alphaDecay(0.02)
      .on('tick', ticked);
  }

  function processTribeData(data, userData) {
    // Create tribes based on age groups and stress levels
    const ageGroups = [
      { name: 'Young', min: 18, max: 30 },
      { name: 'Mid', min: 31, max: 50 },
      { name: 'Senior', min: 51, max: 100 }
    ];

    const sleepGroups = [
      { name: 'Irregular', min: 0, max: 6 },
      { name: 'Normal', min: 6, max: 9 },
      { name: 'Long', min: 9, max: 24 }
    ];

    return ageGroups.flatMap(age => 
      sleepGroups.map(sleep => ({
        name: `${age.name} / ${sleep.name} Sleep`,
        members: data.filter(d => 
          d.age >= age.min && 
          d.age <= age.max &&
          d.sleepHours >= sleep.min &&
          d.sleepHours < sleep.max
        )
      }))
    );
  }

  function findUserTribe(userData, tribes) {
    // Find the appropriate tribe for the user
    const userAge = parseInt(userData.age);
    const userSleep = parseFloat(userData.sleepHours);

    return tribes.find(tribe => {
      const sampleMember = tribe.members[0];
      if (!sampleMember) return false;

      const ageMatch = Math.abs(sampleMember.age - userAge) <= 15;
      const sleepMatch = Math.abs(sampleMember.sleepHours - userSleep) <= 2;

      return ageMatch && sleepMatch;
    })?.name || tribes[0].name;
  }

  function getTribePosition(tribeName) {
    const tribeIndex = tribes.findIndex(t => t.name === tribeName);
    const columns = 3;
    const rows = Math.ceil(tribes.length / columns);
    const col = tribeIndex % columns;
    const row = Math.floor(tribeIndex / columns);

    return {
      x: margin.left + (plotWidth * (col + 0.5)) / columns,
      y: margin.top + (plotHeight * (row + 0.5)) / rows
    };
  }

  function ticked() {
    if (!svg) return;

    const circles = d3.select(svg)
      .select('.plot')
      .selectAll('circle')
      .data([userNode, ...data]);

    circles.join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.isUser ? 8 : 4)
      .attr('fill', d => d.isUser ? '#FFD700' : colorScales.stress(d.stressLevel))
      .attr('stroke', d => d.isUser ? '#FFA500' : 'none')
      .attr('stroke-width', d => d.isUser ? 2 : 0)
      .attr('opacity', d => d.isUser ? 1 : 0.6);

    // Add tribe labels
    const labels = d3.select(svg)
      .select('.labels')
      .selectAll('text')
      .data(tribes);

    labels.join('text')
      .attr('x', d => getTribePosition(d.name).x)
      .attr('y', d => getTribePosition(d.name).y - 50)
      .attr('text-anchor', 'middle')
      .attr('class', 'tribe-label')
      .text(d => d.name);
  }

  // Resize handler
  function handleResize() {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (simulation) {
      simulation.force('center', d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.3).restart();
    }
  }

  onMount(() => {
    initializeSimulation();
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => {
      resizeObserver.disconnect();
      if (simulation) simulation.stop();
    };
  });
</script>

<div class="viz-container" bind:this={container}>
  <svg bind:this={svg} {width} {height}>
    <g class="labels" />
    <g class="plot" />
  </svg>
  
  <div class="legend">
    <div class="legend-header">Your Tribe Analysis</div>
    {#if userNode}
      <div class="user-info">
        <div class="user-marker"></div>
        <div class="info-text">
          <div class="tribe-name">{userNode.tribe}</div>
          <div class="tribe-stats">
            Age Group: {userNode.age < 30 ? 'Young' : userNode.age < 50 ? 'Mid' : 'Senior'}<br>
            Sleep Pattern: {userNode.sleepHours < 6 ? 'Irregular' : userNode.sleepHours > 9 ? 'Long' : 'Normal'}<br>
            Stress Level: {userNode.stressLevel}
          </div>
        </div>
      </div>
      <div class="tribe-members">
        <div class="members-count">
          {tribes.find(t => t.name === userNode.tribe)?.members.length || 0} others in your tribe
        </div>
        <div class="stress-distribution">
          {#each ['Low', 'Medium', 'High'] as level}
            <div class="stress-level">
              <div class="color-dot" style="background-color: {colorScales.stress(level)}"></div>
              <span>{level} Stress</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .viz-container {
    width: 100%;
    height: 100vh;
    position: relative;
    background: var(--color-dark-purple);
    overflow: hidden;
  }

  .legend {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(20, 0, 40, 0.85);
    padding: 1.5rem;
    border-radius: 8px;
    backdrop-filter: blur(8px);
    width: 280px;
  }

  .legend-header {
    color: var(--color-bright-purple);
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 6px;
  }

  .user-marker {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #FFD700;
    border: 2px solid #FFA500;
  }

  .info-text {
    flex: 1;
  }

  .tribe-name {
    color: var(--color-bright-purple);
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .tribe-stats {
    font-size: 0.875rem;
    color: var(--color-off-purple);
    line-height: 1.4;
  }

  .tribe-members {
    padding-top: 1rem;
    border-top: 1px solid rgba(139, 92, 246, 0.2);
  }

  .members-count {
    font-size: 0.875rem;
    color: var(--color-bright-purple);
    margin-bottom: 0.75rem;
  }

  .stress-distribution {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stress-level {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-off-purple);
  }

  .color-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  :global(.tribe-label) {
    fill: var(--color-bright-purple);
    font-size: 0.875rem;
    font-weight: 500;
    opacity: 0.8;
  }
</style>