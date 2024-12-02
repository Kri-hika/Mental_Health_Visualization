// src/routes/+page.server.js
import { promises as fs } from 'fs';
import { csvParse } from 'd3';

export async function load() {
  try {
    // Read the CSV file
    const csvData = await fs.readFile('static/data/mental_health_dataset.csv', 'utf-8');
    const parsedData = csvParse(csvData, d => ({
      id: d.User_ID,
      age: +d.Age,
      gender: d.Gender,
      occupation: d.Occupation,
      country: d.Country,
      mentalHealth: d.Mental_Health_Condition,
      severity: d.Severity,
      consultation: d.Consultation_History,
      stressLevel: d.Stress_Level,
      sleepHours: +d.Sleep_Hours,
      workHours: +d.Work_Hours,
      physicalActivity: +d.Physical_Activity_Hours
    }));

    return { data: parsedData };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}