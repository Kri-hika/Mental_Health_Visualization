# Mental Health Visualization Project

## 🌟 Overview

This project combines two key datasets to provide comprehensive insights into mental health:

### User Mental Health Dataset
- **Source:** mental_health_dataset.csv from Kaggle
- **Scope:** 1,000 tech professionals
- **Focus:** Mental health conditions, stress levels, work-life balance, and sleep patterns
- **Usage:** Powers the interactive cluster exploration tool

### Mental Health Treatment & Care Dataset
- **Source:** U.S. Department of Health & Human Services (data.gov)
- **Scope:** National treatment statistics
- **Focus:** State-by-state treatment percentages across various mental health conditions
- **Usage:** Informs geographic analysis and treatment disparity insights

The project follows a **Martini Glass narrative**, guiding users through:
Cluster-based comparisons -> Personalized data exploration -> Regional treatment insights

This dual-dataset approach enables both:
1. Individual-level analysis through tech professional clustering
2. Broader societal context through national treatment statistics


## 🎯 Key goals:
1. Highlight correlations between stress, work hours, and sleep.
2. Enable user-centric storytelling to contextualize personal mental health.
3. Broaden the perspective to focus on collective challenges and treatment disparities.

---

## 🛠️ Project Framework
- **Frontend Framework:** [SvelteKit](https://kit.svelte.dev/) for building a dynamic and interactive interface.
- **Visualization Library:** [D3.js](https://d3js.org/) for creating scalable data-driven visualizations.
- **Data Source:** Mental health dataset from Kaggle.
- **Narrative Flow:**
  - Cluster identification and behavioral insights.
  - User-specific comparisons and tribe placements.
  - Exploration of treatment gaps and disparities (Data-driven insights need to integrate)

---
## 🚀 Functionality Overview

- Cluster Visualization: Identifies and compares groups based on stress, sleep, and work hours.
- Behavioral Analysis: Explores correlations between variables like work hours and stress.
- User Personalization: Lets users input data to find their cluster and receive actionable insights.
- Treatment Analysis: Highlights disparities using visual tools like heatmaps and bar charts.
- Narrative Insights: Guides users from individual data to broader mental health trends.

---

## 🔧 Setting Up and Running the Project
### Prerequisites
- **Node.js** (v16 or higher)
- **NPM** (or Yarn) for package management

### Steps
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Kri-hika/Mental_Health_Visualization.git
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
  - Open your browser at [http://localhost:5173](http://localhost:5173).


## Future Development Plans (Integration Goals)

The project aims to unify interactive scatter plots with data-driven insights, ensuring seamless transitions and a consistent user interface across visualization types. Enhancements will include integrating personal insights with statistical analysis, linking geographic data to cluster analysis, and enabling cross-visualization interactions.

Technically, efforts will focus on standardizing the data pipeline, unifying the development environment, implementing a consistent API, and managing shared states effectively.

User experience improvements will prioritize smooth navigation, integrated insights from all visualization types, and a cohesive design language for an intuitive and immersive exploration journey.


## 📜 Acknowledgements

* **Dataset Sources:**
  - [Kaggle's mental_health_dataset.csv](https://www.kaggle.com/datasets/bhadramohit/mental-health-dataset)
  - [CDC's Mental Health Care Data](https://data.cdc.gov/NCHS/Mental-Health-Care-in-the-Last-4-Weeks/yni7-er2q/about_data)

* **Frameworks & Tools:**
   * SvelteKit
   * D3.js
   * Node.js

* **Inspiration:** Advocating for mental health awareness in tech industries.

This project combines **storytelling**, **visualization**, and **actionable insights** to drive awareness and advocate for better mental health care.