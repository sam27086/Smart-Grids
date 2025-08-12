document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('prediction-form');
    const resultDiv = document.getElementById('result');
    const clearBtn = document.getElementById('clear-data-btn');

    // Create canvas elements for charts
    const container = document.querySelector('.container');

    const chartContainer = document.createElement('div');
    chartContainer.style.marginTop = '2rem';

    const lineCanvas = document.createElement('canvas');
    lineCanvas.id = 'lineChart';
    chartContainer.appendChild(lineCanvas);

    const barCanvas = document.createElement('canvas');
    barCanvas.id = 'barChart';
    chartContainer.appendChild(barCanvas);

    container.appendChild(chartContainer);

    let lineChart, barChart;

    // Fetch and render prediction history charts
    async function fetchAndRenderCharts() {
        try {
            const response = await fetch('/history');
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                resultDiv.textContent = 'No prediction history available to display charts.';
                // Clear existing charts if any
                if (lineChart) {
                    lineChart.destroy();
                    lineChart = null;
                }
                if (barChart) {
                    barChart.destroy();
                    barChart = null;
                }
                return;
            }

            // Prepare data for charts
            const labels = data.map(item => new Date(item.timestamp).toLocaleString()).reverse();
            const predictions = data.map(item => item.prediction).reverse();

            // Destroy existing charts if any
            if (lineChart) lineChart.destroy();
            if (barChart) barChart.destroy();

            // Line chart for prediction over time
            lineChart = new Chart(document.getElementById('lineChart').getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Blackout Chance (%)',
                        data: predictions,
                        borderColor: 'rgba(106, 17, 203, 0.8)',
                        backgroundColor: 'rgba(106, 17, 203, 0.3)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });

            // Bar chart for prediction distribution
            const bins = new Array(10).fill(0);
            predictions.forEach(p => {
                const index = Math.min(Math.floor(p / 10), 9);
                bins[index]++;
            });

            barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%'],
                    datasets: [{
                        label: 'Number of Predictions',
                        data: bins,
                        backgroundColor: 'rgba(37, 117, 252, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            precision: 0
                        }
                    }
                }
            });

        } catch (error) {
            resultDiv.textContent = 'Error fetching prediction history for charts.';
            console.error(error);
        }
    }

    // Initial chart rendering
    fetchAndRenderCharts();

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        resultDiv.textContent = 'Predicting...';

        const location = form.location.value.trim();
        const feature1 = parseFloat(form.feature1.value);
        const feature2 = parseFloat(form.feature2.value);
        const feature3 = parseFloat(form.feature3.value);

        const payload = {
            location: location,
            features: {
                feature1: feature1,
                feature2: feature2,
                feature3: feature3
            }
        };

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                resultDiv.textContent = 'Error: ' + (errorData.error || 'Prediction failed.');
                return;
            }

            const data = await response.json();
            resultDiv.textContent = `Prediction for ${data.location}: Blackout chance is ${data.blackout_chance}%`;

            // Refresh charts with new data
            fetchAndRenderCharts();

        } catch (error) {
            resultDiv.textContent = 'Error during prediction.';
            console.error(error);
        }
    });

    // Handle clear data button
    clearBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to clear all prediction data?')) return;

        try {
            const response = await fetch('/clear_data', { method: 'POST' });
            const data = await response.json();
            resultDiv.textContent = data.message;

            // Refresh charts after clearing data
            fetchAndRenderCharts();

        } catch (error) {
            resultDiv.textContent = 'Error clearing data.';
            console.error(error);
        }
    });
});
