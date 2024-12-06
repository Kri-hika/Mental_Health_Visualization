<!-- src/lib/components/InsightPanel.svelte -->
<script>
  import { fade } from 'svelte/transition';

  export let processedData;
  export let selectedNode;
  export let hoveredNode;
  export let dimension;

  $: activeNode = selectedNode || hoveredNode;
  $: insights = generateInsights(processedData, activeNode, dimension);

  function generateInsights(data, node, currentDimension) {
    if (!node) return getDimensionSummary(data, currentDimension);
    return getNodeInsights(node, currentDimension);
  }

  function getDimensionSummary(data, dim) {
    switch(dim) {
      case 'worklife':
        const worklifeStats = {
          balanced: data.filter(d => d.worklifeScore.total > 0.7).length,
          moderate: data.filter(d => d.worklifeScore.total > 0.4 && d.worklifeScore.total <= 0.7).length,
          intense: data.filter(d => d.worklifeScore.total <= 0.4).length
        };
        return {
          title: 'Work-Life Balance Overview',
          stats: [
            { label: 'Balanced Lifestyle', value: `${Math.round(worklifeStats.balanced / data.length * 100)}%` },
            { label: 'Moderate Balance', value: `${Math.round(worklifeStats.moderate / data.length * 100)}%` },
            { label: 'Intense Schedule', value: `${Math.round(worklifeStats.intense / data.length * 100)}%` }
          ],
          insights: [
            'Compare your schedule with others',
            'See how lifestyle affects mental health',
            'Find balance opportunities'
          ]
        };

      case 'treatment':
        const treatmentStats = {
          identified: data.filter(d => d.treatmentStatus.hasCondition).length,
          treated: data.filter(d => d.treatmentStatus.seeking).length
        };
        return {
          title: 'Treatment Access Insights',
          stats: [
            { label: 'Identified Conditions', value: `${Math.round(treatmentStats.identified / data.length * 100)}%` },
            { label: 'Seeking Treatment', value: `${Math.round(treatmentStats.treated / data.length * 100)}%` },
            { label: 'Treatment Gap', value: `${Math.round((treatmentStats.identified - treatmentStats.treated) / treatmentStats.identified * 100)}%` }
          ],
          insights: [
            'Understanding treatment barriers',
            'Identifying care patterns',
            'Exploring access opportunities'
          ]
        };

      case 'stress':
        const stressStats = {
          high: data.filter(d => d.stressLevel === 'High').length,
          medium: data.filter(d => d.stressLevel === 'Medium').length,
          low: data.filter(d => d.stressLevel === 'Low').length
        };
        return {
          title: 'Stress Level Analysis',
          stats: [
            { label: 'High Stress', value: `${Math.round(stressStats.high / data.length * 100)}%` },
            { label: 'Medium Stress', value: `${Math.round(stressStats.medium / data.length * 100)}%` },
            { label: 'Low Stress', value: `${Math.round(stressStats.low / data.length * 100)}%` }
          ],
          insights: [
            'Impact of work hours on stress',
            'Sleep quality correlation',
            'Physical activity benefits'
          ]
        };

      default:
        return {
          title: 'Mental Health Tribes',
          stats: [],
          insights: [
            'Explore similar lifestyle patterns',
            'Connect with your tribe',
            'Discover shared experiences'
          ]
        };
    }
  }

  function getNodeInsights(node, dim) {
    // Generate specific insights for the hovered/selected node
    const insights = {
      title: node.isUser ? 'Your Profile' : 'Profile Insights',
      stats: []
    };

    switch(dim) {
      case 'worklife':
        insights.stats = [
          { label: 'Sleep Quality', value: `${Math.round(node.worklifeScore.sleep * 100)}%` },
          { label: 'Work Balance', value: `${Math.round(node.worklifeScore.work * 100)}%` },
          { label: 'Activity Level', value: `${Math.round(node.worklifeScore.activity * 100)}%` }
        ];
        break;

      case 'treatment':
        insights.stats = [
          { label: 'Condition', value: node.treatmentStatus.hasCondition ? 'Yes' : 'No' },
          { label: 'Seeking Help', value: node.treatmentStatus.seeking ? 'Yes' : 'No' },
          { label: 'Access Score', value: `${Math.round(node.treatmentStatus.accessScore * 100)}%` }
        ];
        break;

      case 'stress':
        insights.stats = [
          { label: 'Stress Level', value: node.stressLevel },
          { label: 'Sleep Hours', value: `${node.sleepHours}h` },
          { label: 'Physical Activity', value: `${node.physicalActivity}h/week` }
        ];
        break;
    }

    return insights;
  }
</script>

<div class="insight-panel" class:has-node={activeNode}>
  {#if insights}
    <div class="panel-content" in:fade={{ duration: 200 }}>
      <h3>{insights.title}</h3>
      
      {#if insights.stats.length > 0}
        <div class="stats-grid">
          {#each insights.stats as stat}
            <div class="stat">
              <span class="label">{stat.label}</span>
              <span class="value">{stat.value}</span>
            </div>
          {/each}
        </div>
      {/if}

      {#if insights.insights}
        <div class="insights-list">
          {#each insights.insights as insight}
            <div class="insight-item">
              <span class="bullet">•</span>
              <span class="text">{insight}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .insight-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(20, 0, 40, 0.85);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    padding: 1.5rem;
    width: 300px;
    transition: transform 0.3s ease;
  }

  .panel-content {
    color: var(--color-off-purple);
  }

  h3 {
    color: var(--color-bright-purple);
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .value {
    font-size: 1rem;
    color: var(--color-bright-purple);
    font-weight: 500;
  }

  .insights-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .insight-item {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .bullet {
    color: var(--color-bright-purple);
  }

  @media (max-width: 768px) {
    .insight-panel {
      width: calc(100% - 2rem);
      max-height: 40vh;
      top: auto;
      bottom: 1rem;
      right: 1rem;
      overflow-y: auto;
    }
  }
</style>