<!-- DynamicTribeViz.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import _ from 'lodash';
  import { fade, fly } from 'svelte/transition';
  import { 
    processInitialData,
    generateClusterInsights,
    generateWorkLifeInsights,
    generateTreatmentInsights,
    generateStressInsights,
    STRESS_COLORS,
    WORK_LIFE_COLORS,
    TREATMENT_COLORS
  } from '../utils/dataUtils';

  // Props
  export let data;
  export let userData;

  // DOM references
  let container;
  let svg;
  let tooltipDiv;

  // State variables
  let width = 1000;
  let height = 700;
  let currentView = 'clusters';
  let hoveredEntity = null;
  let selectedEntity = null;
  let processedData;
  let insights;
  let simulation;
  let zoomBehavior;

  // Reactive declarations
  $: containerDimensions = container?.getBoundingClientRect() || { width: 1000, height: 700 };
  $: width = containerDimensions.width;
  $: height = containerDimensions.height;

  // Initialize data and visualization
  onMount(async () => {
    processedData = processInitialData(data);
    insights = {
      clusters: generateClusterInsights(processedData),
      worklife: generateWorkLifeInsights(processedData),
      treatment: generateTreatmentInsights(processedData),
      stress: generateStressInsights(processedData)
    };

    initializeVisualization();
    setupResponsiveness();

    return () => {
      if (simulation) simulation.stop();
    };
  });

  function setupResponsiveness() {
    const resizeObserver = new ResizeObserver(() => {
      if (container) {
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        updateVisualization();
      }
    });

    if (container) {
      resizeObserver.observe(container);
    }

    return () => resizeObserver.disconnect();
  }

  function initializeVisualization() {
    // Initialize D3 zoom behavior
    zoomBehavior = d3.zoom()
      .scaleExtent([0.5, 4])
      .on('zoom', handleZoom);

    d3.select(svg)
      .call(zoomBehavior)
      .call(zoomBehavior.transform, d3.zoomIdentity);

    updateVisualization();
  }

  function handleZoom(event) {
    d3.select(svg).select('.viz-container')
      .attr('transform', event.transform);
  }

  function updateVisualization() {
    switch(currentView) {
      case 'clusters':
        renderClusterView();
        break;
      case 'worklife':
        renderWorkLifeView();
        break;
      case 'treatment':
        renderTreatmentView();
        break;
      case 'stress':
        renderStressView();
        break;
    }
  }

  function renderClusterView() {
    const svg = d3.select(svg);
    svg.selectAll('*').remove();

    const vizContainer = svg.append('g')
      .attr('class', 'viz-container');

    const clusterData = Object.entries(insights.clusters).map(([name, data]) => ({
      id: name,
      ...data,
      radius: Math.sqrt(data.count) * 5
    }));

    // Create force simulation
    simulation = d3.forceSimulation(clusterData)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('collide', d3.forceCollide().radius(d => d.radius + 2))
      .on('tick', () => {
        clusters.attr('transform', d => `translate(${d.x},${d.y})`);
      });

    // Create cluster groups
    const clusters = vizContainer.selectAll('.cluster')
      .data(clusterData)
      .enter()
      .append('g')
      .attr('class', 'cluster')
      .on('mouseover', (event, d) => {
        hoveredEntity = d;
        showTooltip(event, d);
      })
      .on('mouseout', () => {
        hoveredEntity = null;
        hideTooltip();
      })
      .on('click', (event, d) => {
        selectedEntity = selectedEntity === d ? null : d;
        event.stopPropagation();
      });

    // Add cluster circles
    clusters.append('circle')
      .attr('r', d => d.radius)
      .style('fill', d => {
        const [balance, stress] = d.id.split('-');
        return d3.interpolateRgb(WORK_LIFE_COLORS[balance], STRESS_COLORS[stress])(0.5);
      })
      .style('opacity', 0.7)
      .style('stroke', '#fff')
      .style('stroke-opacity', 0.3);

    // Add cluster labels
    clusters.append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .style('fill', '#fff')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    // Add particles for visual interest
    clusters.each(function(d) {
      const particleCount = Math.floor(d.radius / 3);
      const particles = d3.range(particleCount).map(() => ({
        angle: Math.random() * 2 * Math.PI,
        radius: Math.random() * d.radius * 0.8,
        speed: Math.random() * 0.02 + 0.01
      }));

      const particleGroup = d3.select(this)
        .append('g')
        .attr('class', 'particles');

      particles.forEach(p => {
        particleGroup.append('circle')
          .attr('r', 1.5)
          .style('fill', '#fff')
          .style('opacity', 0.6);
      });

      // Animate particles
      function updateParticles() {
        particleGroup.selectAll('circle')
          .data(particles)
          .attr('cx', p => Math.cos(p.angle) * p.radius)
          .attr('cy', p => Math.sin(p.angle) * p.radius);

        particles.forEach(p => {
          p.angle += p.speed;
        });

        requestAnimationFrame(updateParticles);
      }

      updateParticles();
    });
  }

  function renderWorkLifeView() {
    const svg = d3.select(svg);
    svg.selectAll('*').remove();

    const vizContainer = svg.append('g')
      .attr('class', 'viz-container');

    const workLifeData = Object.entries(insights.worklife).map(([balance, data]) => ({
      balance,
      ...data
    }));

    // Create layout
    const padding = 40;
    const innerWidth = width - (padding * 2);
    const innerHeight = height - (padding * 2);

    // Scales
    const xScale = d3.scaleBand()
      .domain(workLifeData.map(d => d.balance))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(workLifeData, d => d.count)])
      .range([innerHeight, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    vizContainer.append('g')
      .attr('transform', `translate(${padding},${height - padding})`)
      .call(xAxis);

    vizContainer.append('g')
      .attr('transform', `translate(${padding},${padding})`)
      .call(yAxis);

    // Create stacked bars
    const stackedData = d3.stack()
      .keys(['Low', 'Medium', 'High'])
      .value((d, key) => d.avgStressDistribution[key] || 0)
      (workLifeData);

    const categoryColors = [
      STRESS_COLORS.Low,
      STRESS_COLORS.Medium,
      STRESS_COLORS.High
    ];

    const layers = vizContainer.selectAll('.layer')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .style('fill', (d, i) => categoryColors[i]);

    layers.selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', (d, i) => xScale(workLifeData[i].balance) + padding)
      .attr('y', d => yScale(d[1]) + padding)
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .on('mouseover', (event, d) => {
        hoveredEntity = d;
        showTooltip(event, d);
      })
      .on('mouseout', () => {
        hoveredEntity = null;
        hideTooltip();
      });
  }

  function renderTreatmentView() {
    const svg = d3.select(svg);
    svg.selectAll('*').remove();

    const vizContainer = svg.append('g')
      .attr('class', 'viz-container');

    const treatmentData = Object.entries(insights.treatment.byOccupation)
      .map(([occupation, data]) => ({
        occupation,
        ...data,
        treatmentRate: data.treated / data.total
      }));

    // Create hexbin layout
    const hexbin = d3.hexbin()
      .radius(30)
      .extent([[0, 0], [width, height]]);

    const points = treatmentData.flatMap(d => 
      Array(d.total).fill().map(() => [
        Math.random() * width,
        Math.random() * height,
        d
      ])
    );

    const bins = hexbin(points);

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateRgb(TREATMENT_COLORS.Untreated, TREATMENT_COLORS.Treated))
      .domain([0, 1]);

    // Draw hexagons
    vizContainer.selectAll('path')
      .data(bins)
      .enter()
      .append('path')
      .attr('d', hexbin.hexagon())
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('fill', d => {
        const avgTreatmentRate = d3.mean(d, p => p[2].treatmentRate);
        return colorScale(avgTreatmentRate);
      })
      .attr('stroke', '#fff')
      .attr('stroke-opacity', 0.3)
      .on('mouseover', (event, d) => {
        hoveredEntity = d;
        showTooltip(event, d);
      })
      .on('mouseout', () => {
        hoveredEntity = null;
        hideTooltip();
      });
  }

  function renderStressView() {
    const svg = d3.select(svg);
    svg.selectAll('*').remove();

    const vizContainer = svg.append('g')
      .attr('class', 'viz-container');

    const stressData = Object.entries(insights.stress).map(([level, data]) => ({
      level,
      ...data
    }));

    // Create radial layout
    const radius = Math.min(width, height) / 2 - 100;
    const angleScale = d3.scalePoint()
      .domain(Object.keys(insights.stress))
      .range([0, Math.PI * 2]);

    vizContainer.attr('transform', `translate(${width/2},${height/2})`);

    // Create stress level segments
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius)
      .startAngle(d => angleScale(d.level) - Math.PI/3)
      .endAngle(d => angleScale(d.level) + Math.PI/3);

    const segments = vizContainer.selectAll('.segment')
      .data(stressData)
      .enter()
      .append('path')
      .attr('class', 'segment')
      .attr('d', arc)
      .style('fill', d => STRESS_COLORS[d.level])
      .style('opacity', 0.6)
      .on('mouseover', (event, d) => {
        hoveredEntity = d;
        showTooltip(event, d);
      })
      .on('mouseout', () => {
        hoveredEntity = null;
        hideTooltip();
      });

    // Add labels
    vizContainer.selectAll('.label')
      .data(stressData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('transform', d => {
        const angle = angleScale(d.level) - Math.PI/2;
        const x = Math.cos(angle) * (radius + 20);
        const y = Math.sin(angle) * (radius + 20);
        return `translate(${x},${y})`;
      })
      .attr('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-size', '14px')
      .text(d => d.level);
  }

  function showTooltip(event, data) {
    const tooltip = d3.select(tooltipDiv);
    const [x, y] = d3.pointer(event);

    tooltip
      .style('left', `${x + 10}px`)
      .style('top', `${y + 10}px`)
      .style('opacity', 1)
      .html(generateTooltipContent(data));
  }

  function hideTooltip() {
    d3.select(tooltipDiv)
      .style('opacity', 0);
  }

  function generateTooltipContent(data) {
    switch(currentView) {
      case 'clusters':
        return `
          <div class="tooltip-content">
            <h3>${data.id}</h3>
            <p>Population: ${data.count}</p>
            <p>Avg Age: ${data.avgAge.toFixed(1)}</p>
            <p>Mental Health Rate: ${(data.mentalHealthRate * 100).toFixed(1)}%</p>
            <p>Consultation Rate: ${(data.consultationRate * 100).toFixed(1)}%</p>
          </div>
        `;
      case 'worklife':
        return `
          <div class="tooltip-content">
            <h3>${data.balance}</h3>
            <p>Work Hours: ${data.avgWorkHours.toFixed(1)}</p>
            <p>Sleep Hours: ${data.avgSleepHours.toFixed(1)}</p>
            <p>Physical Activity: ${data.avgPhysicalActivity.toFixed(1)} hrs/week</p>
          </div>
        `;
      case 'treatment':
        return `
          <div class="tooltip-content">
            <h3>${data[0]?.occupation || 'Treatment Group'}</h3>
            <p>Population: ${data.length}</p>
            <p>Treatment Rate: ${(data[0]?.[2].treatmentRate * 100).toFixed(1)}%</p>
            <p>High Stress Cases: ${data[0]?.[2].highStress || 0}</p>
          </div>
        `;
      case 'stress':
        return `
          <div class="tooltip-content">
            <h3>${data.level} Stress</h3>
            <p>Population: ${data.count}</p>
            <p>Avg Sleep: ${data.avgSleep.toFixed(1)} hrs</p>
            <p>Avg Work: ${data.avgWork.toFixed(1)} hrs/week</p>
            <p>Mental Health Rate: ${(data.mentalHealthRate * 100).toFixed(1)}%</p>
          </div>
        `;
      default:
        return '';
    }
  }

  function handleDimensionChange(event) {
    currentView = event.detail;
    selectedEntity = null;
    updateVisualization();
  }

  // Handle window resize
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (container) {
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        updateVisualization();
      }
    }, 250);
  }
</script>

<svelte:window on:resize={handleResize} />

<div class="dynamic-tribe-viz" bind:this={container}>
  <svg bind:this={svg} {width} {height}>
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  </svg>

  <div class="tooltip" bind:this={tooltipDiv}></div>

  <div class="controls">
    <div class="dimension-controls">
      <button 
        class="dimension-button" 
        class:active={currentView === 'clusters'}
        on:click={() => handleDimensionChange({ detail: 'clusters' })}
      >
        <span class="icon">🌐</span>
        <span class="label">Mental Health Clusters</span>
      </button>
      <button 
        class="dimension-button"
        class:active={currentView === 'worklife'}
        on:click={() => handleDimensionChange({ detail: 'worklife' })}
      >
        <span class="icon">⚖️</span>
        <span class="label">Work-Life Balance</span>
      </button>
      <button 
        class="dimension-button"
        class:active={currentView === 'treatment'}
        on:click={() => handleDimensionChange({ detail: 'treatment' })}
      >
        <span class="icon">🏥</span>
        <span class="label">Treatment Access</span>
      </button>
      <button 
        class="dimension-button"
        class:active={currentView === 'stress'}
        on:click={() => handleDimensionChange({ detail: 'stress' })}
      >
        <span class="icon">📊</span>
        <span class="label">Stress Patterns</span>
      </button>
    </div>
  </div>

  {#if selectedEntity}
    <div class="details-panel" transition:fly="{{ x: 300, duration: 300 }}">
      <h2>{currentView === 'clusters' ? selectedEntity.id : selectedEntity.level || 'Details'}</h2>
      
      {#if currentView === 'clusters'}
        <div class="details-content">
          <div class="stat-group">
            <h3>Population Statistics</h3>
            <p>Total Members: {selectedEntity.count}</p>
            <p>Average Age: {selectedEntity.avgAge.toFixed(1)}</p>
            <p>Mental Health Rate: {(selectedEntity.mentalHealthRate * 100).toFixed(1)}%</p>
          </div>
          
          <div class="stat-group">
            <h3>Lifestyle Metrics</h3>
            <p>Avg Sleep: {selectedEntity.avgSleep.toFixed(1)} hrs</p>
            <p>Avg Work: {selectedEntity.avgWork.toFixed(1)} hrs/week</p>
          </div>

          <div class="stat-group">
            <h3>Risk Analysis</h3>
            <div class="risk-bars">
              {#each Object.entries(selectedEntity.riskScore) as [risk, score]}
                <div class="risk-bar">
                  <span class="risk-label">{risk}</span>
                  <div class="bar-container">
                    <div class="bar" style="width: {score * 100}%"></div>
                  </div>
                  <span class="risk-value">{(score * 100).toFixed(0)}%</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      {#if currentView === 'worklife'}
        <div class="details-content">
          <h3>Work-Life Distribution</h3>
          <div class="distribution-bars">
            {#each Object.entries(selectedEntity.workDistribution) as [category, count]}
              <div class="distribution-bar">
                <span class="category-label">{category}</span>
                <div class="bar-container">
                  <div 
                    class="bar" 
                    style="width: {(count / selectedEntity.count * 100)}%"
                  ></div>
                </div>
                <span class="count-value">{count}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dynamic-tribe-viz {
    width: 100%;
    height: 100%;
    position: relative;
    background: var(--color-dark-purple);
    overflow: hidden;
  }

  .controls {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }

  .dimension-controls {
    display: flex;
    gap: 1rem;
  }

  .dimension-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(20, 0, 40, 0.85);
    border: 1px solid rgba(157, 78, 246, 0.2);
    border-radius: 8px;
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dimension-button:hover {
    border-color: var(--color-bright-purple);
    color: var(--color-bright-purple);
  }

  .dimension-button.active {
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
    border-color: var(--color-bright-purple);
  }

  .tooltip {
    position: absolute;
    padding: 1rem;
    background: rgba(20, 0, 40, 0.95);
    border: 1px solid rgba(157, 78, 246, 0.3);
    border-radius: 8px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    max-width: 300px;
    backdrop-filter: blur(8px);
  }

  .details-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 300px;
    background: rgba(20, 0, 40, 0.95);
    border: 1px solid rgba(157, 78, 246, 0.3);
    border-radius: 8px;
    padding: 1.5rem;
    backdrop-filter: blur(8px);
  }

  .details-panel h2 {
    color: var(--color-bright-purple);
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
  }

  .stat-group {
    margin-bottom: 1.5rem;
  }

  .stat-group h3 {
    color: var(--color-text);
    font-size: 1rem;
    margin: 0 0 0.5rem 0;
  }

  .risk-bars, .distribution-bars {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .risk-bar, .distribution-bar {
    display: grid;
    grid-template-columns: 100px 1fr 50px;
    align-items: center;
    gap: 0.5rem;
  }

  .bar-container {
    height: 8px;
    background: rgba(157, 78, 246, 0.2);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background: var(--color-bright-purple);
    transition: width 0.3s ease;
  }

  @media (max-width: 768px) {
    .controls {
      top: auto;
      bottom: 20px;
    }

    .dimension-controls {
      flex-direction: column;
    }

    .details-panel {
      width: 100%;
      top: auto;
      bottom: 0;
      right: 0;
      border-radius: 8px 8px 0 0;
    }
  }
</style>