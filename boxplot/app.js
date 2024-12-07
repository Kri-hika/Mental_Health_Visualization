import { mountBoxPlot, BoxPlot } from './src/boxplots'
import './style.css'

document.querySelector('#app').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap'>
    ${BoxPlot()}   
  </div>
`

mountBoxPlot();
