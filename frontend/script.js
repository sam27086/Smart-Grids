document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('prediction-form');
    const resultDiv = document.getElementById('result');
    const clearBtn = document.getElementById('clear-data-btn');

    let lineChart, barChart;

    // Fetch and render prediction history charts
    async function fetchAndRenderCharts() {
        try {
            const response = await fetch('/history');
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                resultDiv.textContent = 'No prediction history available to display charts.';
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

            const labels = data.map(item => new Date(item.timestamp).toLocaleString()).reverse();
            const predictions = data.map(item => item.prediction).reverse();

            if (lineChart) lineChart.destroy();
            if (barChart) barChart.destroy();

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

    // Fetch and render model evaluation metrics
    async function fetchAndRenderMetrics() {
        try {
            console.log('Fetching metrics...');
            const response = await fetch('/metrics');
            console.log('Response status:', response.status);
            if (!response.ok) {
                console.log('Response not ok, hiding tables');
                document.getElementById('metrics-table').style.display = 'none';
                document.getElementById('confusion-matrix').style.display = 'none';
                return;
            }
            const metrics = await response.json();
            console.log('Metrics data:', metrics);


            const metricsTableBody = document.querySelector('#metrics-table tbody');
            metricsTableBody.innerHTML = '';

            const metricNames = ['accuracy', 'precision', 'recall', 'f1_score'];
            metricNames.forEach(name => {
                const tr = document.createElement('tr');
                const tdName = document.createElement('td');
                tdName.textContent = name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ');
                const tdValue = document.createElement('td');
                tdValue.textContent = (parseFloat(metrics[name]) * 100).toFixed(2) + '%';
                tr.appendChild(tdName);
                tr.appendChild(tdValue);
                metricsTableBody.appendChild(tr);
            });


            // Render confusion matrix
            const cmTable = document.getElementById('confusion-matrix');
            cmTable.innerHTML = '';
            const cm = metrics.confusion_matrix;

            // Header row
            const headerRow = document.createElement('tr');
            headerRow.appendChild(document.createElement('th')); // empty corner
            const predLabels = ['Predicted No Blackout', 'Predicted Blackout'];
            for (let i = 0; i < cm.length; i++) {
                const th = document.createElement('th');
                th.textContent = predLabels[i] || 'Pred ' + i;
                headerRow.appendChild(th);
            }
            cmTable.appendChild(headerRow);

            // Data rows
            const actualLabels = ['Actual No Blackout', 'Actual Blackout'];
            for (let i = 0; i < cm.length; i++) {
                const row = document.createElement('tr');
                const th = document.createElement('th');
                th.textContent = actualLabels[i] || 'Actual ' + i;
                row.appendChild(th);
                for (let j = 0; j < cm[i].length; j++) {
                    const td = document.createElement('td');
                    td.textContent = cm[i][j];
                    row.appendChild(td);
                }
                cmTable.appendChild(row);
            }


            document.getElementById('metrics-table').style.display = '';
            document.getElementById('confusion-matrix').style.display = '';

        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    }

    // Initial rendering
    fetchAndRenderCharts();
    fetchAndRenderMetrics();

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

            // Refresh charts and metrics with new data
            fetchAndRenderCharts();
            fetchAndRenderMetrics();

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

            // Refresh charts and metrics after clearing data
            fetchAndRenderCharts();
            fetchAndRenderMetrics();

        } catch (error) {
            resultDiv.textContent = 'Error clearing data.';
            console.error(error);
        }
    });
});
