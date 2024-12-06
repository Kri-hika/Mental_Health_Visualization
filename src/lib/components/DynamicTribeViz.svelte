
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import * as d3 from 'd3';
  import _ from 'lodash';

  export let data;
  export let layout = 'gather';
  console.log('Original Data:', data);
  

  const dispatch = createEventDispatcher();
  let svg;
  let container;
  let width = 1000;
  let height = 700;
  let isInitialAnimation = true;
  let tooltip;
  let activeInsight = 'overview';

  const margin = {
    top: 80,
    right: 200,
    bottom: 60,
    left: 80
  };

  const colors = {
    background: 'rgba(20, 0, 20, 0.95)',
    primary: '#9D4EDD',
    secondary: '#43E8D8',
    highlight: '#FF6B9C',
    text: '#B8A2CE',
    textBright: '#E2D9F3',
    accent: '#FF9E64',
    secondary: '#43E8D8',  // Make sure this exists
    highlight: '#FF6B9C'   // Make sure this exists
  };


  const insights = [
    {
      id: 'overview',
      title: 'Mental Health Landscape',
      description: 'Exploring the prevalence and patterns of mental health conditions across different groups.'
    },
    {
      id: 'workStress',
      title: 'Work Hours & Stress',
      description: 'Higher work hours correlate strongly with increased stress levels and mental health conditions.'
    },
    {
      id: 'sleepImpact',
      title: 'Sleep Patterns',
      description: 'Sleep duration shows a significant inverse relationship with stress levels and mental health.'
    },
    {
      id: 'ageStress',
      title: 'Age Distribution',
      description: 'Mental health conditions vary significantly across age groups, with distinct patterns.'
    },
    {
      id: 'treatment',
      title: 'Treatment Access',
      description: 'Examining the gaps between those needing and receiving mental health support.'
    }
  ];

  function setupFilters() {
    const defs = d3.select(svg).append('defs');
    
    // Glow effect
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Gradient definitions
    const gradient = defs.append('linearGradient')
      .attr('id', 'stress-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colors.highlight);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colors.secondary);
  }

  function setupTooltip() {
    tooltip = d3.select(container)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', colors.background)
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('color', colors.text)
      .style('z-index', 100);
  }

  const propertyMappings = {
    mentalHealth: 'Mental_Health_Condition',
    occupation: 'Occupation'
  };

  async function renderVisualization() {
    const svgEl = d3.select(svg);
    svgEl.selectAll('*').remove();
    
    setupFilters();

    switch(activeInsight) {
      case 'overview':
        await renderOverview(svgEl);
        break;
      case 'workStress':
        await renderWorkStressInsight(svgEl);
        break;
      case 'sleepImpact':
        await renderSleepInsight(svgEl);
        break;
      case 'ageStress':
        await renderAgeStressInsight(svgEl);
        break;
      case 'treatment':
        await renderTreatmentInsight(svgEl);
        break;
    }
  }

  async function renderOverview(svg) {
    // Clear previous content
    svg.selectAll('*').remove();
    
    const g = svg.append('g')
      .attr('class', 'overview-group')
      .style('opacity', 0);

    // Process data for stacked bar chart
    const processedData = d3.rollup(data.mentalHealthData, // Update to use mentalHealthData
      v => ({
        total: v.length,
        withCondition: v.filter(d => d.mentalHealth === 'Yes').length,
        withoutCondition: v.filter(d => d.mentalHealth === 'No').length
      }),
      d => d.occupation
    );

    console.log('Processed Data:', processedData); // Debug log
    


    const stackedData = Array.from(processedData, ([occupation, stats]) => ({
      occupation,
      'With Condition': (stats.withCondition / stats.total) * 100,
      'Without Condition': (stats.withoutCondition / stats.total) * 100,
      total: stats.total
    }));

    console.log('Stacked Data:', stackedData); // Debug log

    // Update width and height based on container
    const width = svg.attr('width');
    const height = svg.attr('height');

    console.log('Dimensions:', { width, height }); // Debug log

    // Create scales
    const x = d3.scaleBand()
      .domain(stackedData.map(d => d.occupation))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, 100]) // Assuming percentages
      .range([height - margin.bottom, margin.top]);


    // Create color scale
    const color = d3.scaleOrdinal()
      .domain(['With Condition', 'Without Condition'])
      .range([colors.highlight, colors.secondary]);

    // Stack the data
    const stack = d3.stack()
      .keys(['With Condition', 'Without Condition']);

    const stackedSeries = stack(stackedData);

    console.log('Stacked Series:', stackedSeries); // Debug log
    console.log('X Scale Domain:', x.domain());
    console.log('Y Scale Domain:', y.domain());
    console.log('Color Scale Domain:', color.domain());
    console.log('Color Scale Range:', color.range());


    // Draw stacked bars
    const bars = g.selectAll('g.stack')
      .data(stackedSeries)
      .join('g')
      .attr('class', 'stack')
      .attr('fill', d => color(d.key));

    bars.selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('x', d => x(d.data.occupation))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth())
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        const percentage = (d[1] - d[0]).toFixed(1);
        d3.select(this)
          .attr('opacity', 1)
          .style('filter', 'url(#glow)');

        tooltip
          .style('opacity', 1)
          .html(`
            <div>${d.data.occupation}</div>
            <div>${d3.select(this.parentNode).datum().key}: ${percentage}%</div>
            <div>Total employees: ${d.data.total}</div>
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.8)
          .style('filter', null);
        tooltip.style('opacity', 0);
      });

    // Add axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .call(g => {
        g.select('.domain').attr('stroke', colors.text);
        g.selectAll('.tick line').attr('stroke', colors.text);
        g.selectAll('.tick text')
          .attr('fill', colors.text)
          .style('text-anchor', 'end')
          .attr('dx', '-.8em')
          .attr('dy', '.15em')
          .attr('transform', 'rotate(-45)');
      });

    const yAxis = g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d => d + '%'))
      .call(g => {
        g.select('.domain').attr('stroke', colors.text);
        g.selectAll('.tick line').attr('stroke', colors.text);
        g.selectAll('.tick text').attr('fill', colors.text);
      });

    // Add title
    g.append('text')
      .attr('class', 'title')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.textBright)
      .text('Mental Health Distribution by Occupation');

    // Add legend
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - margin.right + 40}, ${margin.top})`);

    ['With Condition', 'Without Condition'].forEach((key, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', color(key));

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('fill', colors.text)
        .style('font-size', '12px')
        .text(key);
    });

    // Make sure the group is visible
    g.style('opacity', 1);

    // Log if we reached the end of the function
    console.log('Render complete');
  }

  async function renderWorkStressInsight(svg) {
    const g = svg.append('g')
      .attr('class', 'work-stress-group')
      .style('opacity', 0);

    // Process work hours data
    const workHoursData = Array.from(d3.rollup(data,
      v => ({
        total: v.length,
        highStress: v.filter(d => d.Stress_Level === 'High').length
      }),
      d => Math.floor(d.Work_Hours / 10) * 10
    )).map(([hours, stats]) => ({
      hours,
      stressRate: (stats.highStress / stats.total) * 100
    })).sort((a, b) => a.hours - b.hours);

    // Create scales
    const x = d3.scaleBand()
      .domain(workHoursData.map(d => d.hours))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    // Draw bars
    g.selectAll('rect')
      .data(workHoursData)
      .join('rect')
      .attr('x', d => x(d.hours))
      .attr('y', d => y(d.stressRate))
      .attr('width', x.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.stressRate))
      .attr('fill', colors.primary)
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .style('filter', 'url(#glow)');

        tooltip
          .style('opacity', 1)
          .html(`
            <div>Work Hours: ${d.hours}-${d.hours + 10}</div>
            <div>High Stress: ${d.stressRate.toFixed(1)}%</div>
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.8)
          .style('filter', null);
        tooltip.style('opacity', 0);
      });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .call(g => g.select('.domain').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick line').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick text').attr('fill', colors.text));

    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d => d + '%'))
      .call(g => g.select('.domain').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick line').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick text').attr('fill', colors.text));

    // Add labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.textBright)
      .text('Weekly Work Hours');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', margin.left - 40)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.textBright)
      .text('High Stress Rate (%)');

    // Animate in
    g.transition()
      .duration(1000)
      .style('opacity', 1);
  }

  async function renderSleepInsight(svg) {
    const g = svg.append('g')
      .attr('class', 'sleep-insight-group')
      .style('opacity', 0);

    // Process sleep data
    const sleepData = Array.from(d3.rollup(data,
      v => ({
        total: v.length,
        withCondition: v.filter(d => d.Mental_Health_Condition === 'Yes').length
      }),
      d => Math.floor(d.Sleep_Hours)
    )).map(([hours, stats]) => ({
      hours,
      rate: (stats.withCondition / stats.total) * 100
    })).sort((a, b) => a.hours - b.hours);

    // Create scales
    const x = d3.scaleLinear()
      .domain([d3.min(sleepData, d => d.hours), d3.max(sleepData, d => d.hours)])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    // Create line generator
    const line = d3.line()
      .x(d => x(d.hours))
      .y(d => y(d.rate))
      .curve(d3.curveCatmullRom);

    // Draw path
    g.append('path')
      .datum(sleepData)
      .attr('fill', 'none')
      .attr('stroke', colors.highlight)
      .attr('stroke-width', 2)
      .attr('d', line)
      .style('filter', 'url(#glow)');

    // Add data points
    g.selectAll('circle')
      .data(sleepData)
      .join('circle')
      .attr('cx', d => x(d.hours))
      .attr('cy', d => y(d.rate))
      .attr('r', 4)
      .attr('fill', colors.highlight)
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('r', 6)
          .attr('opacity', 1);

        tooltip
          .style('opacity', 1)
          .html(`
            <div>Sleep Hours: ${d.hours}</div>
            <div>Mental Health Conditions: ${d.rate.toFixed(1)}%</div>
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 4)
          .attr('opacity', 0.8);
        tooltip.style('opacity', 0);
      });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6))
      .call(g => g.select('.domain').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick line').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick text').attr('fill', colors.text));

    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d => d + '%'))
      .call(g => g.select('.domain').attr('stroke', colors.text))
      .call(g => g.select('.domain').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick line').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick text').attr('fill', colors.text));

    // Add labels and title
    g.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.textBright)
      .attr('class', 'chart-title')
      .text('Sleep Hours vs Mental Health Conditions');

    // Animate in
    g.transition()
      .duration(1000)
      .style('opacity', 1);
  }

  async function renderAgeStressInsight(svg) {
  const g = svg.append('g')
    .attr('class', 'age-stress-group')
    .style('opacity', 0);

  // Process age data
  const ageRanges = [  // Renamed from ageGroups
    { range: '18-29', min: 18, max: 29 },
    { range: '30-39', min: 30, max: 39 },
    { range: '40-49', min: 40, max: 49 },
    { range: '50-59', min: 50, max: 59 },
    { range: '60+', min: 60, max: Infinity }
  ];

  const ageData = ageRanges.map(group => {  // Using ageRanges instead of ageGroups
    const groupData = data.filter(d => 
      d.Age >= group.min && d.Age <= group.max
    );
    return {
      range: group.range,
      total: groupData.length,
      highStress: groupData.filter(d => d.Stress_Level === 'High').length,
      withCondition: groupData.filter(d => d.Mental_Health_Condition === 'Yes').length
    };
  });

    // Set up scales
    const x = d3.scaleBand()
      .domain(ageData.map(d => d.range))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    // Create grouped bars
    const subgroups = ['highStress', 'withCondition'];
    const xSubgroup = d3.scaleBand()
      .domain(subgroups)
      .range([0, x.bandwidth()])
      .padding(0.05);

    const color = d3.scaleOrdinal()
      .domain(subgroups)
      .range([colors.highlight, colors.primary]);

    // Draw bars (renamed variable here)
  const ageBarGroups = g.selectAll('.age-group')  // Renamed from ageGroups
    .data(ageData)
    .join('g')
    .attr('class', 'age-group')
    .attr('transform', d => `translate(${x(d.range)},0)`);

  ageBarGroups.selectAll('rect')  // Use new variable name
    .data(d => subgroups.map(key => ({
      key,
      value: (d[key] / d.total) * 100
    })))
    .join('rect')
    .attr('x', d => xSubgroup(d.key))
    .attr('y', d => y(d.value))
    .attr('width', xSubgroup.bandwidth())
    .attr('height', d => height - margin.bottom - y(d.value))
    .attr('fill', d => color(d.key))
    .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .style('filter', 'url(#glow)');

        tooltip
          .style('opacity', 1)
          .html(`
            <div>${d.key === 'highStress' ? 'High Stress' : 'With Condition'}</div>
            <div>${d.value.toFixed(1)}%</div>
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.8)
          .style('filter', null);
        tooltip.style('opacity', 0);
      });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .call(g => g.select('.domain').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick line').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick text').attr('fill', colors.text));

    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d => d + '%'))
      .call(g => g.select('.domain').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick line').attr('stroke', colors.text))
      .call(g => g.selectAll('.tick text').attr('fill', colors.text));

    // Animate in
    g.transition()
      .duration(1000)
      .style('opacity', 1);
  }

  async function renderTreatmentInsight(svg) {
    const g = svg.append('g')
      .attr('class', 'treatment-group')
      .style('opacity', 0);

    // Process treatment data
    const treatmentData = Array.from(d3.rollup(data,
      v => ({
        total: v.length,
        withCondition: v.filter(d => d.Mental_Health_Condition === 'Yes').length,
        seekingTreatment: v.filter(d => 
          d.Mental_Health_Condition === 'Yes' && 
          d.Consultation_History === 'Yes'
        ).length
      }),
      d => d.Occupation
    )).map(([occupation, stats]) => ({
      occupation,
      conditionRate: (stats.withCondition / stats.total) * 100,
      treatmentRate: (stats.seekingTreatment / stats.withCondition) * 100
    }));

    // Create scales
    const x = d3.scaleBand()
      .domain(treatmentData.map(d => d.occupation))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    // Draw bars
    g.selectAll('.treatment-bars')
      .data(treatmentData)
      .join('g')
      .attr('class', 'treatment-bars')
      .attr('transform', d => `translate(${x(d.occupation)},0)`)
      .call(g => {
        g.append('rect')
          .attr('x', 0)
          .attr('y', d => y(d.conditionRate))
          .attr('width', x.bandwidth() / 2)
          .attr('height', d => height - margin.bottom - y(d.conditionRate))
          .attr('fill', colors.primary)
          .attr('opacity', 0.8);

        g.append('rect')
          .attr('x', x.bandwidth() / 2)
          .attr('y', d => y(d.treatmentRate))
          .attr('width', x.bandwidth() / 2)
          .attr('height', d => height - margin.bottom - y(d.treatmentRate))
          .attr('fill', colors.highlight)
          .attr('opacity', 0.8);
      });

    // Add axes and labels
    // ... (similar to previous axes code)

    // Animate in
    g.transition()
      .duration(1000)
      .style('opacity', 1);
  }


  onMount(() => {
    if (!browser) return;
    
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width || 1000;
      height = rect.height || 700;
      renderVisualization();
    };

    updateDimensions();
    setupTooltip();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);
    
    console.log('Stacked Series:', stackedSeries);
    console.log('SVG Dimensions:', { width, height });
    
    return () => {
      resizeObserver.disconnect();
      if (simulation) simulation.stop();
    };
  });

  $: {
    if (svg && data) {
      renderVisualization();
    }
  }
</script>

<div class="viz-container" bind:this={container}>
  <!-- Navigation -->
  <div class="nav-panel">
    {#each insights as insight}
      <button 
        class="nav-button"
        class:active={activeInsight === insight.id}
        on:click={() => activeInsight = insight.id}
      >
        {insight.title}
      </button>
    {/each}
  </div>

  <!-- Main Visualization -->
  <svg bind:this={svg} {width} {height}>
    <g class="viz-group" />
  </svg>

  <!-- Insight Panel -->
  <div class="insight-panel">
    <h3>{insights.find(i => i.id === activeInsight)?.title}</h3>
    <p>{insights.find(i => i.id === activeInsight)?.description}</p>
  </div>
</div>

<style>
  .viz-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--color-dark-purple);
    overflow: hidden;
  }

  .nav-panel {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.5rem;
    z-index: 10;
  }

  .nav-button {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-bright-purple);
    color: var(--color-bright-purple);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-button.active {
    background: var(--color-bright-purple);
    color: var(--color-dark-purple);
  }

  .insight-panel {
    position: absolute;
    left: 2rem;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(20, 0, 20, 0.85);
    padding: 1.5rem;
    border-radius: 8px;
    backdrop-filter: blur(8px);
    max-width: 280px;
    z-index: 10;
  }

  .insight-panel h3 {
    color: var(--color-bright-purple);
    margin: 0 0 1rem 0;
  }

  .insight-panel p {
    color: var(--color-off-purple);
    margin: 0;
    line-height: 1.5;
  }

  :global(.viz-group) {
    transition: opacity 0.3s;
  }

  :global(circle) {
    transition: r 0.2s ease-out, opacity 0.2s ease-out;
  }
</style>