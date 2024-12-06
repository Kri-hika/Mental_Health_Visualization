<!-- src/lib/components/TribeVisualization.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import _ from 'lodash';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let data;
  export let userData;

  let svg;
  let container;
  let simulation;
  let width = 1000;
  let height = 700;
  let clusters = [];
  let zoomBehavior;

  // Process and enhance data
  function processData() {
    const processedData = data.map(d => ({
      ...d,
      wlbScore: calculateWLBScore(d),
      cluster: determineCluster(d),
      isUser: false,
      x: width / 2 + (Math.random() - 0.5) * 10,
      y: height / 2 + (Math.random() - 0.5) * 10
    }));

    const userDataProcessed = {
      ...userData,
      wlbScore: calculateWLBScore(userData),
      cluster: determineCluster(userData),
      isUser: true,
      x: width / 2,
      y: height / 2
    };

    return [...processedData, userDataProcessed];
  }

  function calculateWLBScore(d) {
    const sleepIdeal = 8;
    const workIdeal = 40;
    const sleepDiff = Math.abs(d.sleepHours - sleepIdeal);
    const workDiff = Math.abs(d.workHours - workIdeal);
    return 1 - ((sleepDiff / 5 + workDiff / 20) / 2);
  }

  function determineCluster(d) {
    const wlbLevel = d.wlbScore > 0.7 ? 'Balanced' : 
                    d.wlbScore > 0.4 ? 'Moderate' : 'Strained';
    const ageGroup = d.age < 30 ? 'Young' :
                    d.age < 50 ? 'Mid' : 'Senior';
    return `${wlbLevel}-${d.stressLevel}-${ageGroup}`;
  }

  // Calculate hexagonal grid positions
  function calculateHexPositions(numClusters) {
    const positions = [];
    const hexRadius = 120; // Radius of hexagon
    const hexWidth = hexRadius * Math.sqrt(3);
    const hexHeight = hexRadius * 2;
    
    // Calculate how many hexagons we need in each row to form a roughly circular pattern
    const maxRadius = Math.ceil(Math.sqrt(numClusters / Math.PI));
    let currentPos = { q: 0, r: 0 };
    
    // Generate positions in a spiral pattern
    const directions = [
      { q: 1, r: 0 }, // right
      { q: 0, r: 1 }, // down-right
      { q: -1, r: 1 }, // down-left
      { q: -1, r: 0 }, // left
      { q: 0, r: -1 }, // up-left
      { q: 1, r: -1 }  // up-right
    ];
    
    for (let radius = 0; radius <= maxRadius && positions.length < numClusters; radius++) {
      if (radius === 0) {
        positions.push({
          x: width/2,
          y: height/2
        });
        continue;
      }
      
      // For each side of the hexagon
      for (let side = 0; side < 6; side++) {
        // For each step along the side
        for (let step = 0; step < radius && positions.length < numClusters; step++) {
          currentPos.q += directions[side].q;
          currentPos.r += directions[side].r;
          
          // Convert axial coordinates to pixel coordinates
          const x = width/2 + hexWidth * (currentPos.q + currentPos.r/2);
          const y = height/2 + hexHeight * (currentPos.r * 3/4);
          
          positions.push({ x, y });
        }
      }
    }
    
    return positions;
  }

  function initializeVisualization() {
    if (!svg || !data || !userData) return;

    // Clear existing elements
    d3.select(svg).selectAll('*').remove();

    const processedData = processData();
    clusters = _.groupBy(processedData, 'cluster');

    // Create main group for zooming
    const g = d3.select(svg)
      .append('g')
      .attr('class', 'viz-group');

    // Initialize zoom behavior
    zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    d3.select(svg).call(zoomBehavior);

    // Calculate hexagonal grid positions
    const hexPositions = calculateHexPositions(Object.keys(clusters).length);
    
    // Assign positions to clusters
    const clusterCenters = {};
    Object.keys(clusters).forEach((clusterName, i) => {
      clusterCenters[clusterName] = hexPositions[i];
    });

    // Create force simulation
    simulation = d3.forceSimulation(processedData)
      .alphaDecay(0.01)
      .velocityDecay(0.6)
      .force('center', d3.forceCenter(width/2, height/2))
      .force('charge', d3.forceManyBody().strength(d => d.isUser ? -100 : -30))
      .force('collision', d3.forceCollide().radius(d => d.isUser ? 15 : 5))
      .force('cluster', alpha => {
        processedData.forEach(d => {
          const center = clusterCenters[d.cluster];
          const k = alpha * 1;
          d.vx -= (d.x - center.x) * k;
          d.vy -= (d.y - center.y) * k;
        });
      })
      .on('tick', () => ticked(g));

    // Create gradient definitions
    const defs = g.append('defs');
    createGradients(defs);

    // Add hexagonal backgrounds
    g.append('g')
      .attr('class', 'cluster-backgrounds')
      .selectAll('path')
      .data(Object.entries(clusterCenters))
      .join('path')
      .attr('d', d => createHexPath(d[1].x, d[1].y, 100))
      .attr('fill', (d, i) => `url(#cluster-gradient-${i})`)
      .attr('opacity', 0.1);

    // Add nodes
    const nodes = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(processedData)
      .join('circle')
      .attr('r', d => d.isUser ? 8 : 4)
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => d.isUser ? '#FFD700' : 'none')
      .attr('stroke-width', d => d.isUser ? 2 : 0)
      .transition()
      .delay((d, i) => (d.cluster === userData.cluster ? i * 20 : i * 5))
      .duration(300)
      .attr('opacity', d => d.isUser ? 1 : 0.6);

    // Add cluster labels
g.append('g')
  .attr('class', 'labels')
  .selectAll('text')
  .data(Object.entries(clusterCenters))
  .join('text')
  .attr('x', d => d[1].x) // Center horizontally
  .attr('y', d => {
    const clusterSize = clusters[d[0]].length;
    const dynamicOffset = Math.sqrt(clusterSize) * 5; // Offset proportional to cluster size
    return d[1].y - dynamicOffset - 20; // Position above the cluster
  })
  .text(d => formatClusterLabel(d[0])) // Use narrative labels
  .attr('text-anchor', 'middle') // Center align
  .attr('class', 'cluster-label')
  .style('opacity', 1); // Ensure visibility


// Resolve label overlaps
const labelPositions = [];
g.selectAll('.cluster-label')
  .attr('y', (d, i, nodes) => {
    const label = d3.select(nodes[i]);
    let y = parseFloat(label.attr('y'));

    // Prevent overlap
    labelPositions.forEach(pos => {
      if (Math.abs(pos - y) < 30) {
        y += 30; // Move downward
      }
    });

    labelPositions.push(y);
    return y;
  });


    // Initial animation sequence
    startCinematicSequence(processedData, g);
  }

  function createHexPath(centerX, centerY, radius) {
    const angles = d3.range(6).map(i => i * Math.PI / 3);
    const points = angles.map(angle => [
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle)
    ]);
    return `M${points[0][0]},${points[0][1]}${points.slice(1).map(p => `L${p[0]},${p[1]}`).join('')}Z`;
  }

  function createGradients(defs) {
    const gradients = [
      ['#4FACFF', '#43E8D8'], // Balanced
      ['#9D4EDD', '#FF9E64'], // Moderate
      ['#FF6B9C', '#FF4646']  // Strained
    ];

    gradients.forEach((colors, i) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `cluster-gradient-${i}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colors[0])
        .attr('stop-opacity', 0.2);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colors[1])
        .attr('stop-opacity', 0);
    });
  }

  async function startCinematicSequence(processedData, g) {
    const userNode = processedData.find(d => d.isUser);
    const userCluster = clusters[userNode.cluster];
    
    // Initial state - all nodes invisible
    g.selectAll('circle')
      .attr('opacity', 0);
    
    g.selectAll('path')
      .attr('opacity', 0);

    // 1. Fade in user's node with a pulse effect
    const userCircle = g.selectAll('circle').filter(d => d.isUser);
    await pulseAnimation(userCircle);

    // 2. Zoom to user's cluster
    await zoomToNode(userNode, 2);

    // 3. Fade in user's cluster hex background with ripple effect
    const userHex = g.selectAll('path')
      .filter((d, i) => d[0] === userNode.cluster);
    await rippleAnimation(userHex);

    // 4. Fade in cluster members with staggered timing
    const clusterNodes = g.selectAll('circle')
      .filter(d => d.cluster === userNode.cluster && !d.isUser);
    await staggeredFadeIn(clusterNodes);

    // 5. Show cluster label with typing effect
    const label = g.selectAll('.cluster-label')
      .filter(d => d[0] === userNode.cluster);
    await typewriterEffect(label);

    // 6. Gradually zoom out with smooth transition
    await zoomToNode(userNode, 0.8, 2000);

    // 7. Reveal other clusters with cascade effect
    await revealOtherClusters(g, userNode.cluster);
  }

  async function pulseAnimation(selection) {
    await selection
      .transition()
      .duration(10)
      .attr('opacity', 1)
      .attr('r', 12)
      .transition()
      .duration(500)
      .attr('r', 8)
      .end();
  }

  async function rippleAnimation(selection) {
    await selection
      .attr('opacity', 0)
      .attr('transform', 'scale(0.8)')
      .transition()
      .duration(50)
      .attr('opacity', 0.1)
      .attr('transform', 'scale(1)')
      .end();
  }

  async function staggeredFadeIn(selection) {
    const delay = 50;
    let i = 0;
    for (const node of selection.nodes()) {
      await d3.select(node)
        .transition()
        .delay(i * delay)
        .duration(50)
        .attr('opacity', 0.6)
        .end();
      i++;
    }
  }

  async function typewriterEffect(selection) {
    const text = selection.text();
    selection.text('');
    
    await selection
      .style('opacity', 1)
      .end();
    
    for (let i = 0; i <= text.length; i++) {
      selection.text(text.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  async function revealOtherClusters(g, userCluster) {
    const otherHexes = g.selectAll('path')
      .filter((d, i) => d[0] !== userCluster);
    const otherNodes = g.selectAll('circle')
      .filter(d => d.cluster !== userCluster);
    const otherLabels = g.selectAll('.cluster-label')
      .filter(d => d[0] !== userCluster);

    await Promise.all([
      otherHexes
        .transition()
        .duration(1000)
        .attr('opacity', 0.1)
        .end(),
      otherNodes
        .transition()
        .duration(1000)
        .attr('opacity', 0.4)
        .end(),
      otherLabels
        .transition()
        .duration(1000)
        .style('opacity', 0.8)
        .end()
    ]);
  }

  function transition(selection, duration) {
    return new Promise(resolve => {
      selection.transition()
        .duration(duration)
        .on('end', resolve);
    });
  }

  function zoomToNode(node, scale = 2, duration = 1500) {
    return new Promise(resolve => {
      d3.select(svg)
        .transition()
        .duration(duration)
        .call(zoomBehavior.transform,
          d3.zoomIdentity
            .translate(width/2, height/2)
            .scale(scale)
            .translate(-node.x, -node.y))
        .on('end', resolve);
    });
  }

  function getNodeColor(d) {
    if (d.isUser) return '#FFD700';
    
    const stressColors = {
      'Low': '#4FACFF',
      'Medium': '#9D4EDD',
      'High': '#FF6B9C'
    };

    return stressColors[d.stressLevel];
  }

 function formatClusterLabel(cluster) {
  const [balance, stress, age] = cluster.split('-');

  if (balance === 'Balanced' && stress === 'Low' && age === 'Young') {
    return 'Thriving Youngsters';
  }
  if (balance === 'Moderate' && stress === 'Medium' && age === 'Mid') {
    return 'Resilient Workers';
  }
  if (balance === 'Strained' && stress === 'High' && age === 'Senior') {
    return 'Overburdened Seniors';
  }
  if (balance === 'Strained' && stress === 'High' && age === 'Mid') {
    return 'Strained Professionals';
  }

  return `${balance} | ${stress} Stress | ${age}`; // Fallback for other combinations
}


  function ticked(g) {
    g.selectAll('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }

  onMount(() => {
    if (container) {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      initializeVisualization();

      const resizeObserver = new ResizeObserver(_.debounce(() => {
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        initializeVisualization();
      }, 100));

      resizeObserver.observe(container);
      return () => {
        resizeObserver.disconnect();
        if (simulation) simulation.stop();
      };
    }
  });
</script>

<div class="viz-container" bind:this={container}>
  <svg bind:this={svg} {width} {height}></svg>
  
  <div class="info-panel">
    <h3>Where you stand</h3>
    <div class="user-stats">
      <div class="stat">
        <span class="label">Age:</span>
        <span class="value">{userData?.age} years</span>
      </div>
      <div class="stat">
        <span class="label">Sleep:</span>
        <span class="value">{userData?.sleepHours} hours</span>
      </div>
      <div class="stat">
        <span class="label">Work:</span>
        <span class="value">{userData?.workHours} hours/week</span>
      </div>
      <div class="stat">
        <span class="label">Stress:</span>
        <span class="value">{userData?.stressLevel}</span>
      </div>
    </div>

    <div class="legend">
      <h4>Stress Levels</h4>
      <div class="legend-item">
        <span class="color-dot" style="background: #4FACFF"></span>
        <span>Low</span>
      </div>
      <div class="legend-item">
        <span class="color-dot" style="background: #9D4EDD"></span>
        <span>Medium</span>
      </div>
      <div class="legend-item">
        <span class="color-dot" style="background: #FF6B9C"></span>
        <span>High</span>
      </div>
    </div>
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

  svg {
    width: 100%;
    height: 100%;
  }

  .info-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(20, 0, 40, 0.85);
    padding: 1.5rem;
    border-radius: 16px;
    backdrop-filter: blur(8px);
    width: 280px;
    color: var(--color-off-purple);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(139, 92, 246, 0.1);
  }

  h3 {
    color: var(--color-bright-purple);
    font-size: 1.25rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  .user-stats {
    background: rgba(255, 215, 0, 0.1);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255, 215, 0, 0.2);
  }

  .stat {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .stat:last-child {
    margin-bottom: 0;
  }

  .label {
    color: rgba(255, 255, 255, 0.7);
  }

  .value {
    color: var(--color-bright-purple);
    font-weight: 500;
  }

  .legend {
    border-top: 1px solid rgba(139, 92, 246, 0.2);
    padding-top: 1rem;
  }

  h4 {
    color: var(--color-bright-purple);
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .color-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
  }

  :global(.cluster-label) {
    fill: #616161; /* Bright contrasting color */
    font-size: 10px; /* Larger font for better readability */
    font-weight: normal; /* Make labels stand out */
    text-anchor: middle; /* Align text to the center */
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); /* Shadow for better contrast */
  }


  @media (max-width: 768px) {
    .info-panel {
      width: calc(100% - 40px);
      top: auto;
      bottom: 20px;
    }
  }
</style>