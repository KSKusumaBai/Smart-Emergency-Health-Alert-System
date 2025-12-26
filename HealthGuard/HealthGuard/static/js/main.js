// Main application logic
class HealthMonitor {
    constructor() {
        this.isMonitoring = false;
        this.currentData = {
            heartRate: 0,
            bloodPressure: { systolic: 0, diastolic: 0 },
            temperature: 0,
            activityState: 'rest'
        };
        this.charts = {};
        this.initializeCharts();
        this.startLocationTracking();
    }

    initializeCharts() {
        // Heart Rate Chart
        const hrCtx = document.getElementById('heartRateChart');
        if (hrCtx) {
            this.charts.heartRate = new Chart(hrCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Heart Rate (bpm)',
                        data: [],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 50,
                            max: 150
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Blood Pressure Chart
        const bpCtx = document.getElementById('bloodPressureChart');
        if (bpCtx) {
            this.charts.bloodPressure = new Chart(bpCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Systolic',
                        data: [],
                        borderColor: '#17a2b8',
                        backgroundColor: 'rgba(23, 162, 184, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Diastolic',
                        data: [],
                        borderColor: '#6f42c1',
                        backgroundColor: 'rgba(111, 66, 193, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 60,
                            max: 200
                        }
                    }
                }
            });
        }
    }

    updateDisplay(data) {
        // Update metric cards
        document.getElementById('heartRate').textContent = `${data.heartRate} bpm`;
        document.getElementById('bloodPressure').textContent = `${data.bloodPressure.systolic}/${data.bloodPressure.diastolic}`;
        document.getElementById('temperature').textContent = `${data.temperature}°F`;
        document.getElementById('activityState').textContent = this.formatActivityState(data.activityState);

        // Update charts
        this.updateCharts(data);

        // Update health status
        this.updateHealthStatus(data);
    }

    updateCharts(data) {
        const currentTime = new Date().toLocaleTimeString();

        // Heart Rate Chart
        if (this.charts.heartRate) {
            const hrChart = this.charts.heartRate;
            hrChart.data.labels.push(currentTime);
            hrChart.data.datasets[0].data.push(data.heartRate);

            // Keep only last 20 data points
            if (hrChart.data.labels.length > 20) {
                hrChart.data.labels.shift();
                hrChart.data.datasets[0].data.shift();
            }
            hrChart.update('none');
        }

        // Blood Pressure Chart
        if (this.charts.bloodPressure) {
            const bpChart = this.charts.bloodPressure;
            bpChart.data.labels.push(currentTime);
            bpChart.data.datasets[0].data.push(data.bloodPressure.systolic);
            bpChart.data.datasets[1].data.push(data.bloodPressure.diastolic);

            // Keep only last 20 data points
            if (bpChart.data.labels.length > 20) {
                bpChart.data.labels.shift();
                bpChart.data.datasets[0].data.shift();
                bpChart.data.datasets[1].data.shift();
            }
            bpChart.update('none');
        }
    }

    updateHealthStatus(data) {
        const statusElement = document.getElementById('healthStatus');
        const analysis = window.mlAnalyzer ? window.mlAnalyzer.analyzeHealthData(data) : { status: 'normal', message: 'All parameters normal' };

        let statusClass = 'normal';
        let iconClass = 'fas fa-check-circle';
        
        if (analysis.status === 'warning') {
            statusClass = 'warning';
            iconClass = 'fas fa-exclamation-triangle';
        } else if (analysis.status === 'danger') {
            statusClass = 'danger';
            iconClass = 'fas fa-exclamation-circle';
        }

        statusElement.innerHTML = `
            <div class="status-indicator ${statusClass} mb-2">
                <i class="${iconClass} fa-2x"></i>
            </div>
            <p class="mb-0">${analysis.message}</p>
        `;

        // Handle abnormal readings
        if (analysis.status !== 'normal') {
            this.handleAbnormalReading(data, analysis);
        }
    }

    async handleAbnormalReading(data, analysis) {
        // Store abnormal data
        const location = await this.getCurrentLocation();
        
        const healthRecord = {
            ...data,
            location: location,
            is_abnormal: true,
            analysis_result: analysis.message
        };

        try {
            await fetch('/api/health-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(healthRecord)
            });
        } catch (error) {
            console.error('Failed to store health data:', error);
        }

        // Show alert
        this.showAlert(analysis.message, analysis.status);

        // Check for emergency conditions
        if (analysis.status === 'danger' || this.detectFall(data)) {
            this.triggerEmergencyAlert(data, location);
        }
    }

    detectFall(data) {
        // Simple fall detection based on heart rate spike and activity change
        // In a real implementation, this would use accelerometer data
        const heartRateSpike = data.heartRate > 120 && this.currentData.heartRate < 100;
        const suddenActivityChange = data.activityState !== this.currentData.activityState;
        
        return heartRateSpike && suddenActivityChange;
    }

    showAlert(message, type) {
        const alertsList = document.getElementById('alertsList');
        const alertClass = type === 'danger' ? 'alert-danger' : 'alert-warning';
        
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>${new Date().toLocaleTimeString()}</strong> - ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertsList.innerHTML = alertHtml + alertsList.innerHTML;
    }

    async triggerEmergencyAlert(healthData, location) {
        if (window.alertManager) {
            window.alertManager.triggerEmergency({
                type: 'health_emergency',
                healthData: healthData,
                location: location
            });
        }
    }

    formatActivityState(state) {
        const states = {
            'rest': 'Resting',
            'light': 'Light Activity',
            'moderate': 'Moderate Activity',
            'intense': 'Intense Activity',
            'sleep': 'Sleeping'
        };
        return states[state] || 'Unknown';
    }

    async getCurrentLocation() {
        if (window.locationManager) {
            return await window.locationManager.getCurrentLocation();
        }
        return null;
    }

    startLocationTracking() {
        if (window.locationManager) {
            window.locationManager.startTracking();
        }
    }

    // Simulate health data for demo
    startSimulation() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        const simulate = () => {
            if (!this.isMonitoring) return;
            
            // Generate realistic health data
            const baseHeartRate = 70 + Math.sin(Date.now() / 10000) * 10;
            const heartRate = Math.round(baseHeartRate + (Math.random() - 0.5) * 20);
            
            const baseSystolic = 120 + Math.sin(Date.now() / 15000) * 10;
            const systolic = Math.round(baseSystolic + (Math.random() - 0.5) * 15);
            const diastolic = Math.round(systolic * 0.6 + (Math.random() - 0.5) * 10);
            
            const baseTemp = 98.6;
            const temperature = (baseTemp + (Math.random() - 0.5) * 2).toFixed(1);
            
            const activities = ['rest', 'light', 'moderate'];
            const activityState = activities[Math.floor(Math.random() * activities.length)];
            
            this.currentData = {
                heartRate,
                bloodPressure: { systolic, diastolic },
                temperature: parseFloat(temperature),
                activityState
            };
            
            this.updateDisplay(this.currentData);
            
            setTimeout(simulate, 2000); // Update every 2 seconds
        };
        
        simulate();
    }

    stopSimulation() {
        this.isMonitoring = false;
    }
}

// Initialize health monitor when page loads
let healthMonitor;

document.addEventListener('DOMContentLoaded', function() {
    healthMonitor = new HealthMonitor();
    
    // Start simulation if no real device is connected
    setTimeout(() => {
        if (!window.bluetoothManager || !window.bluetoothManager.isConnected()) {
            healthMonitor.startSimulation();
        }
    }, 1000);
});

// Global functions for device connection
function connectToDevice() {
    if (window.bluetoothManager) {
        window.bluetoothManager.connect();
    } else {
        alert('Bluetooth is not supported in this browser. Using simulation mode.');
        healthMonitor.startSimulation();
    }
}

function triggerEmergency() {
    if (window.alertManager) {
        window.alertManager.showEmergencyModal();
    }
}
