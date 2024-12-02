import { scaleLinear } from 'd3-scale';

export function formatWorkHours(hours) {
  return `${hours}h/week`;
}

export function formatSleepHours(hours) {
  return `${hours.toFixed(1)}h/day`;
}

export function calculateStatistics(data) {
  return {
    totalParticipants: data.length,
    withConditions: data.filter(d => d.Mental_Health_Condition === 'Yes').length,
    averageWorkHours: d3.mean(data, d => d.Work_Hours),
    averageSleepHours: d3.mean(data, d => d.Sleep_Hours),
    occupationBreakdown: d3.rollup(data, 
      v => v.length,
      d => d.Occupation
    )
  };
}

export function createScales(data, width, height, margin) {
  return {
    x: scaleLinear()
      .domain([0, d3.max(data, d => d.Work_Hours)])
      .range([margin.left, width - margin.right]),
    y: scaleLinear()
      .domain([0, d3.max(data, d => d.Sleep_Hours)])
      .range([height - margin.bottom, margin.top])
  };
}