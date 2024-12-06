import * as d3 from 'd3';
import axios from 'axios';
import { isEmpty, debounce } from 'lodash';

const margin = { left: 60, right: 20, top: 70, bottom: 110 };
var size = { width: 0, height: 0 }

const data = await d3.csv('./data/mental-health.csv', (d) => { 
    return { 
        age: d["Age"],
        severity: d["Severity"],
    };
});

const groupedData = d3.group(data, d => d.severity);

const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach(entry => {
        if (entry.target.getAttribute('id') !== 'container2') return;
        size = { width: entry.contentRect.width - 100, height: entry.contentRect.height };
        if (size.width > 0 && size.height > 0) {
            d3.select('#box-svg').selectAll('*').remove();
            initBoxPlot();
        }
    });
});

export const BoxPlot = () => (
    `<div class='chart-container d-flex' id='container2' style='margin-left: 130px; margin-top: 100px;'>
        <svg id='box-svg' width='100%' height='100%'></svg>
    </div>`
);

export function mountBoxPlot() {
    const container = document.querySelector('#container2');
    resizeObserver.observe(container);
    initBoxPlot();
}

function initBoxPlot() {

    const chartContainer = d3.select('#box-svg');
    chartContainer.selectAll('*').remove();

    const severityCategories = ["None", "Low", "Medium", "High"];

    const stats = severityCategories.map(category => {
        const ages = groupedData.get(category)?.map(d => d.age).sort(d3.ascending) || [];
        const q1 = Math.round(d3.quantile(ages, 0.25)); // Round Q1
        const median = Math.round(d3.quantile(ages, 0.5)); // Round Median
        const q3 = Math.round(d3.quantile(ages, 0.75)); // Round Q3
        const iqr = q3 - q1;
        const min = Math.max(d3.min(ages), q1 - 1.5 * iqr);
        const max = Math.min(d3.max(ages), q3 + 1.5 * iqr);

        return { category, ages, min, q1, median, q3, max };
    });

    const xScale = d3.scaleBand()
        .domain(severityCategories)
        .range([margin.left, size.width - margin.right])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([d3.min(stats, d => d.min), d3.max(stats, d => d.max)])
        .nice()
        .range([size.height - margin.bottom, margin.top]);

    const colorScale = d3.scaleOrdinal()
        .domain(severityCategories)
        .range(['green', 'blue', 'orange', 'red']);

    chartContainer.append('g')
        .attr('transform', `translate(0, ${size.height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('font-size', '1rem');

    chartContainer.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    chartContainer.append('g')
        .attr('transform', `translate(${(size.width / 2) + 25}, ${size.height - margin.bottom + 50})`)
        .append('text')
        .text('Mental Health Severity')
        .style('font-size', '1.3rem')
        .style('text-anchor', 'middle');

    chartContainer.append('g')
        .attr('transform', `translate(${margin.left - 40}, ${(size.height / 2)-20}) rotate(-90)`)
        .append('text')
        .text('Age')
        .style('font-size', '1.2rem')
        .style('text-anchor', 'middle');

    const boxWidth = xScale.bandwidth() * 0.8;
    const boxGroup = chartContainer.append('g');

    stats.forEach(stat => {
        const categoryX = xScale(stat.category) + xScale.bandwidth() / 2;

        boxGroup.append('rect')
            .attr('x', categoryX - boxWidth / 2)
            .attr('y', yScale(stat.q3))
            .attr('width', boxWidth)
            .attr('height', yScale(stat.q1) - yScale(stat.q3))
            .attr('fill', colorScale(stat.category))
            .attr('stroke', 'black');

        boxGroup.append('line')
            .attr('x1', categoryX - boxWidth / 2)
            .attr('x2', categoryX + boxWidth / 2)
            .attr('y1', yScale(stat.median))
            .attr('y2', yScale(stat.median))
            .attr('stroke', 'black');

        boxGroup.append('line')
            .attr('x1', categoryX)
            .attr('x2', categoryX)
            .attr('y1', yScale(stat.min))
            .attr('y2', yScale(stat.max))
            .attr('stroke', 'black');

        boxGroup.append('line')
            .attr('x1', categoryX - boxWidth / 4)
            .attr('x2', categoryX + boxWidth / 4)
            .attr('y1', yScale(stat.min))
            .attr('y2', yScale(stat.min))
            .attr('stroke', 'black');

        boxGroup.append('line')
            .attr('x1', categoryX - boxWidth / 4)
            .attr('x2', categoryX + boxWidth / 4)
            .attr('y1', yScale(stat.max))
            .attr('y2', yScale(stat.max))
            .attr('stroke', 'black');

        // Add numbers to the right of the box plots (min, q1, median, q3, max)
        boxGroup.append('text')
            .attr('x', categoryX + boxWidth / 2 - 50)
            .attr('y', yScale(stat.min))
            .attr('dy', '0.3em')
            .text(Math.round(stat.min))
            .style('font-size', '0.9rem')
            .style('text-anchor', 'left');

        boxGroup.append('text')
            .attr('x', categoryX + boxWidth / 2 + 8)
            .attr('y', yScale(stat.q1))
            .attr('dy', '0.3em')
            .text(Math.round(stat.q1))
            .style('font-size', '0.9rem')
            .style('text-anchor', 'left');

        boxGroup.append('text')
            .attr('x', categoryX + boxWidth / 2 + 8)
            .attr('y', yScale(stat.median))
            .attr('dy', '0.3em')
            .text(Math.round(stat.median))
            .style('font-size', '0.9rem')
            .style('text-anchor', 'left');

        boxGroup.append('text')
            .attr('x', categoryX + boxWidth / 2 + 8)
            .attr('y', yScale(stat.q3))
            .attr('dy', '0.3em')
            .text(Math.round(stat.q3))
            .style('font-size', '0.9rem')
            .style('text-anchor', 'left');

        boxGroup.append('text')
            .attr('x', categoryX + boxWidth / 2 - 50)
            .attr('y', yScale(stat.max))
            .attr('dy', '0.3em')
            .text(Math.round(stat.max))
            .style('font-size', '0.9rem')
            .style('text-anchor', 'left');
    });

    chartContainer.append('g')
        .append('text')
        .attr('transform', `translate(${size.width / 2}, ${(margin.top / 2) - 10})`)
        .text('Box Plot of Age Distribution by Mental Health Severity Level')
        .style('font-size', '1.5rem')
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold');
}
