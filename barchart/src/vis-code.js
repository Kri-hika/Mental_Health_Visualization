import * as d3 from 'd3';
import axios from 'axios';
import { isEmpty, debounce } from 'lodash';

const margin = { left: 60, right: 20, top: 70, bottom: 110 };
var size = { width: 0, height: 0 }

const data = await d3.csv('./data/mental-health.csv', (d) => { 
    return { 
        occ: d["Occupation"],
        severity: d["Severity"],
    };
});

// Group and summarize data by "occ" and "severity"
const rollupData = d3.rollups(
    data,
    v => v.length,
    d => d.occ,
    d => d.severity
).map(([category, values]) => ({
    category,
    values: values.map(([subCategory, count]) => ({ subCategory, count }))
}));

// Extract all unique severity categories to define color scale
const severityCategories = ["None", "Low", "Medium", "High"];

// Define color scale for severity categories
const colorScale = d3.scaleOrdinal()
    .domain(["None", "Low", "Medium", "High"])
    .range(["green", "blue", "orange", "red"]);

// Resize observer function for container
const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach(entry => {
        if (entry.target.getAttribute('id') !== 'container1') return;
        size = { width: entry.contentRect.width - 100, height: entry.contentRect.height };
        if (size.width > 0 && size.height > 0) {
            d3.select('#bar-svg').selectAll('*').remove();
            initChart();
        }
    });
});

// Define SVG container for grouped bar chart
export const BarChart = () => (
    `<div class='chart-container d-flex' id='container1' style='margin-left: 130px; margin-top: 100px;'>
        <svg id='bar-svg' width='100%' height='100%'></svg>
    </div>`
);

export function mountBarChart() {
    const container = document.querySelector('#container1');
    resizeObserver.observe(container);
    initChart();
}

function initChart() {
    // Container setup
    const chartContainer = d3.select('#bar-svg');
    chartContainer.selectAll('*').remove();

    // Set x-axis categories and y-axis range
    const xCategories = rollupData.map(d => d.category);
    const yExtents = d3.max(rollupData.map(d => d3.max(d.values.map(sub => sub.count))));

    const xScale = d3.scaleBand()
        .range([margin.left, size.width - margin.right])
        .domain(xCategories)
        .padding(0.2);

    const xSubScale = d3.scaleBand()
        .domain(severityCategories)
        .range([0, xScale.bandwidth()])
        .padding(0.05);

    const yScale = d3.scaleLinear()
        .range([size.height - margin.bottom, margin.top])
        .domain([0, yExtents]);

    // Create x-axis and y-axis
    chartContainer.append('g')
        .attr('transform', `translate(0, ${size.height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    chartContainer.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    chartContainer.append('g')
        .attr('transform', `translate(${(size.width / 2)}, ${size.height - margin.bottom + 40})`)
        .append('text')
        .text('Occupation')
        .style('font-size', '1.1rem')
        .style('text-anchor', 'middle');

    // Add y-axis label
    chartContainer.append('g')
        .attr('transform', `translate(${margin.left - 40}, ${size.height / 2}) rotate(-90)`)
        .append('text')
        .text('Frequency')
        .style('font-size', '1rem')
        .style('text-anchor', 'middle');

    // Draw grouped bars
    chartContainer.append('g')
        .selectAll('g')
        .data(rollupData)
        .join('g')
        .attr('transform', d => `translate(${xScale(d.category)}, 0)`)
        .selectAll('rect')
        .data(d => d.values)
        .join('rect')
        .attr('x', d => xSubScale(d.subCategory))
        .attr('width', xSubScale.bandwidth())
        .attr('y', size.height - margin.bottom)
        .attr('height', 0)
        .attr('fill', d => colorScale(d.subCategory))
        .transition()
        .duration(750)
        .attr('y', d => yScale(d.count))
        .attr('height', d => yScale(0) - yScale(d.count));
    
    // Draw numbers at the top of each bar
    chartContainer.append('g')
        .selectAll('g')
        .data(rollupData)
        .join('g')
        .attr('transform', d => `translate(${xScale(d.category)}, 0)`)
        .selectAll('text')
        .data(d => d.values)
        .join('text')
        .attr('x', d => xSubScale(d.subCategory) + xSubScale.bandwidth() / 2)
        .attr('y', d => yScale(d.count) - 5) // Slightly above the bar
        .attr('text-anchor', 'middle')
        .style('font-size', '0.8rem')
        .style('fill', 'black')
        .text(d => d.count); // Display the count


    // Add legend
    const legend = chartContainer.append('g')
        .attr('transform', `translate(${size.width - margin.right - 150}, ${margin.top})`);

    severityCategories.forEach((cat, i) => {
        legend.append('rect')
            .attr('x', 0)
            .attr('y', i * 20)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', colorScale(cat));

        legend.append('text')
            .attr('x', 25)
            .attr('y', i * 20 + 9)
            .attr('dy', '0.35em')
            .text(cat);
    });

    // Add title
    chartContainer.append('g')
        .append('text')
        .attr('transform', `translate(${size.width / 2}, ${(margin.top / 2)- 10})`)
        .text('Bar Chart of Mental Health Severity by Occupation')
        .style('font-size', '1.5rem')
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold');
}
