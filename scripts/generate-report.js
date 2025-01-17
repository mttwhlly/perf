// scripts/generate-report.js
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateReport() {
    try {
        const resultsDir = join(__dirname, '..', 'results');
        const files = await fs.readdir(resultsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length === 0) {
            console.error('No benchmark results found');
            return;
        }

        // Read the most recent benchmark result
        const latestFile = jsonFiles.sort().reverse()[0];
        const resultData = JSON.parse(
            await fs.readFile(join(resultsDir, latestFile), 'utf8')
        );

        // Generate HTML report
        const html = generateHtmlReport(resultData);
        const reportPath = join(resultsDir, 'reports/report.html');
        await fs.writeFile(reportPath, html);

        console.log(`Report generated at: ${reportPath}`);
    } catch (error) {
        console.error('Error generating report:', error);
    }
}

function generateHtmlReport(data) {
    const scenarios = ['form', 'realtime', 'animation', 'websocket', 'dom'];
    const frameworks = Object.keys(data.results);

    // Prepare data for charts
    const renderTimeData = prepareChartData(data, 'averageRenderTime', 'Render Time (ms)');
    const memoryData = prepareChartData(data, 'jsHeapSize', 'Memory Usage');
    const scriptDurationData = prepareChartData(data, 'scriptDuration', 'Script Duration (ms)');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Framework Benchmark Results</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .chart-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            margin: 20px 0;
        }
        h1, h2 {
            color: #333;
        }
        .metadata {
            background: #e9ecef;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
    </style>
</head>
<body>
    <h1>Framework Benchmark Results</h1>
    
    <div class="metadata">
        <h3>Test Information</h3>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Node Version: ${data.metadata.node}</p>
    </div>

    <div class="chart-container">
        <h2>Render Times Comparison</h2>
        <canvas id="renderTimeChart"></canvas>
    </div>

    <div class="chart-container">
        <h2>Memory Usage Comparison</h2>
        <canvas id="memoryChart"></canvas>
    </div>

    <div class="chart-container">
        <h2>Script Duration Comparison</h2>
        <canvas id="scriptDurationChart"></canvas>
    </div>

    <script>
        const renderTimeData = ${JSON.stringify(renderTimeData)};
        const memoryData = ${JSON.stringify(memoryData)};
        const scriptDurationData = ${JSON.stringify(scriptDurationData)};

        function createChart(id, data, label) {
            const ctx = document.getElementById(id);
            return new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(scenarios)},
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: label
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Create charts
        createChart('renderTimeChart', renderTimeData, 'Average Render Time (ms)');
        createChart('memoryChart', memoryData, 'Memory Usage');
        createChart('scriptDurationChart', scriptDurationData, 'Script Duration (ms)');
    </script>
</body>
</html>`;
}

function prepareChartData(data, metric, label) {
    const frameworks = Object.keys(data.results);
    const scenarios = ['form', 'realtime', 'animation', 'websocket', 'dom'];
    const colors = [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)'
    ];

    return {
        datasets: frameworks.map((framework, index) => ({
            label: framework,
            data: scenarios.map(scenario => {
                const value = data.summary[framework][scenario]?.[metric] || 0;
                return typeof value === 'string' ? parseFloat(value) : value;
            }),
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length].replace('0.5', '1'),
            borderWidth: 1
        }))
    };
}

// Run the report generator if called directly
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    generateReport();
}

export default generateReport;