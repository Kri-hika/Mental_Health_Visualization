import { mountBarChart, BarChart } from './src/barchart'
import './style.css'

document.querySelector('#app').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap'>
    ${BarChart()}   
  </div>
`

mountBarChart();
