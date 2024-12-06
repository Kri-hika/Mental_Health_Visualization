## Heatmap

This visualization is a geographic heatmap of the United States depicting the state-based average percentage of people that receive treatment for mental illnessed, averaged across all mental health conditions within each state. 

The computation and compilation the average percentages per state can be found in `state_percentages.py`. I utilized Python in this regard as it is ideal for data aggregation and writing the aggregated data into a new CSV file, titled `treatment-by-state.csv`. 

This visualization was not programmatically generated. It was developed through an online geographic heatmap generator that took the state averages data as input. We originally aimed to programmatically create this heatmap visualization but ran into far too many roadblocks.

To view the visualization, click on the HTML file in this folder. However, please note the limitations with this file. Although the webpage loads properly and provides smooth zooming functions, the color scale and mouseover element that were present during the creation of the heatmap are not within the HTML file. This is likely a glitch with the software. To capture what the visualization is supposed to be like, we took a video of the heatmap during creation, showcasing the mouseover element and red/green color scale. This can be found in the file Heatmap Video.gif.
