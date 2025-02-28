// Predefined user credentials
const VALID_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'user', password: 'user123', role: 'user' }
];

// Initialize chart data
let consumptionChart;
let statsBarChart;
let energyPieChart;
let currentLoggedInUser = null;

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');
    const loginScreen = document.getElementById('loginScreen');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const sidebar = document.querySelector('.sidebar');
    
    // Check credentials
    const validUser = VALID_USERS.find(
        user => user.username === username && user.password === password
    );
    
    if (validUser) {
        // Store the current user
        currentLoggedInUser = validUser;
        
        // Update user display in header
        document.getElementById('currentUser').textContent = validUser.username;
        document.getElementById('dropdownUsername').textContent = validUser.username;
        document.getElementById('currentUser').classList.remove('hidden');
        
        // Immediately show dashboard without hiding
        loginScreen.style.display = 'none';
        dashboardContainer.classList.remove('hidden');
        dashboardContainer.classList.add('active');

        // Show sidebar
        sidebar.classList.add('active');

        // Set up based on role
        if (validUser.role === 'admin') {
            // For admin, show both sections in sidebar
            document.querySelector('a[href="#users"]').parentElement.style.display = 'block';
        } else {
            // For regular users, hide the users section in sidebar
            document.querySelector('a[href="#users"]').parentElement.style.display = 'none';
        }

        // Initialize view - always start with home for both roles
        document.querySelector('#home').classList.remove('hidden');
        document.querySelector('#home').classList.add('active');
        document.querySelector('#statistics').classList.add('hidden');
        document.querySelector('#statistics').classList.remove('active');
        document.querySelector('#users').classList.add('hidden');
        document.querySelector('#users').classList.remove('active');

        // Ensure home link is active
        document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active-nav'));
        document.querySelector('a[href="#home"]').classList.add('active-nav');

        // Activate cards
        document.querySelectorAll('.card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('active');
            }, index * 100);
        });

        // Fetch and display real data
        fetchDataAndUpdateDashboard();

        // Reset error message
        loginError.classList.add('hidden');
    } else {
        // Show error message
        loginError.classList.remove('hidden');
    }
});

// Function to fetch data from the server and update dashboard
function fetchDataAndUpdateDashboard() {
    // Fetch consumption data for chart
    fetch('data-fetcher.php?request=consumption_data')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching consumption data:', data.error);
                return;
            }
            
            // Update chart with real data
            updateConsumptionChart(data.hourly);
            
            // Update dashboard cards with consumption data
            updateDashboardCards(data);
        })
        .catch(error => {
            console.error('Error fetching consumption data:', error);
        });
    
    // Fetch statistics data
    fetch('data-fetcher.php?request=statistics_data')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching statistics data:', data.error);
                return;
            }
            
            // Update statistics chart and table
            updateStatisticsDisplay(data);
        })
        .catch(error => {
            console.error('Error fetching statistics data:', error);
        });
}

// Function to update the consumption chart with real data
function updateConsumptionChart(data) {
    const ctx = document.getElementById('consumptionChart').getContext('2d');
    
    // Extract data from API response
    const timeLabels = data.map(item => item.hour);
    const currentData = data.map(item => parseFloat(item.current));
    const voltageData = data.map(item => parseFloat(item.voltage));
    const currentUsedData = data.map(item => parseFloat(item.current_used));
    const isPeakData = data.map(item => parseInt(item.is_peak) === 1);
    
    // If chart already exists, destroy it
    if (consumptionChart) {
        consumptionChart.destroy();
    }
    
    // Create new chart with real data
    consumptionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Current (A)',
                    data: currentData,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Voltage (V)',
                    data: voltageData,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: 'Current Used (A)',
                    data: currentUsedData,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#e2e8f0'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(226, 232, 240, 0.1)'
                    },
                    ticks: {
                        color: '#e2e8f0'
                    },
                    title: {
                        display: true,
                        text: 'Current (A)',
                        color: '#e2e8f0'
                    }
                },
                y1: {
                    beginAtZero: false,
                    position: 'right',
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: '#e2e8f0'
                    },
                    title: {
                        display: true,
                        text: 'Voltage (V)',
                        color: '#e2e8f0'
                    }
                },
                y2: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: '#e2e8f0'
                    },
                    title: {
                        display: true,
                        text: 'Current Used (A)',
                        color: '#e2e8f0'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(226, 232, 240, 0.1)'
                    },
                    ticks: {
                        color: '#e2e8f0'
                    },
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#e2e8f0'
                    }
                }
            }
        }
    });
}

// Function to update dashboard cards with consumption data
function updateDashboardCards(data) {
    // Get average current
    const avgCurrent = parseFloat(data.average.avg_current).toFixed(2);
    document.getElementById('totalConsumption').textContent = `${avgCurrent} A`;
    
    // Last week data - mocked as there's no historical data provided
    document.getElementById('lastWeekConsumption').textContent = `Last week: ${(avgCurrent * 0.85).toFixed(2)} A`;
    
    // Get peak information
    if (data.peak) {
        const peakTime = new Date(data.peak.peak_time).toLocaleTimeString();
        const peakDate = new Date(data.peak.peak_time).toLocaleDateString();
        document.getElementById('peakHours').textContent = peakTime;
        document.getElementById('peakConsumption').textContent = `Date: ${peakDate}, Peak: ${parseFloat(data.peak.peak_current).toFixed(2)} A`;
    } else {
        document.getElementById('peakHours').textContent = 'No peak detected';
        document.getElementById('peakConsumption').textContent = 'No peak data available';
    }
}

// Function to update statistics display
function updateStatisticsDisplay(data) {
    // Update statistics table
    updateStatsTable(data.stats);
    
    // Update bar chart
    updateStatsBarChart(data.stats);
    
    // Update pie chart
    updateCurrentPieChart(data.hourly);
}

// Function to update the statistics table
function updateStatsTable(statsData) {
    const tableBody = document.getElementById('statsTableBody');
    tableBody.innerHTML = '';
    
    statsData.forEach(stat => {
        const row = document.createElement('tr');
        row.className = 'border-b border-slate-700';
        
        row.innerHTML = `
            <td class="p-3">${stat.metric}</td>
            <td class="p-3">${parseFloat(stat.average).toFixed(2)}</td>
            <td class="p-3">${parseFloat(stat.minimum).toFixed(2)}</td>
            <td class="p-3">${parseFloat(stat.maximum).toFixed(2)}</td>
            <td class="p-3">${parseFloat(stat.std_dev).toFixed(2)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Function to update the statistics bar chart
function updateStatsBarChart(statsData) {
    const ctx = document.getElementById('statsBarChart').getContext('2d');
    
    // Extract data for each metric
    const metrics = statsData.map(item => item.metric);
    const averages = statsData.map(item => parseFloat(item.average));
    const minimums = statsData.map(item => parseFloat(item.minimum));
    const maximums = statsData.map(item => parseFloat(item.maximum));
    const stdDevs = statsData.map(item => parseFloat(item.std_dev));
    
    // Destroy existing chart if it exists
    if (statsBarChart) {
        statsBarChart.destroy();
    }
    
    // Create new bar chart for statistics
    statsBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metrics,
            datasets: [
                {
                    label: 'Average',
                    data: averages,
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 1
                },
                {
                    label: 'Minimum',
                    data: minimums,
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1
                },
                {
                    label: 'Maximum',
                    data: maximums,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1
                },
                {
                    label: 'Std Dev',
                    data: stdDevs,
                    backgroundColor: 'rgba(249, 115, 22, 0.7)',
                    borderColor: 'rgb(249, 115, 22)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e2e8f0'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(226, 232, 240, 0.1)'
                    },
                    ticks: {
                        color: '#e2e8f0'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(226, 232, 240, 0.1)'
                    },
                    ticks: {
                        color: '#e2e8f0'
                    }
                }
            }
        }
    });
}

// Function to update the current pie chart (renamed from energyPieChart)
function updateCurrentPieChart(hourlyData) {
    const ctx = document.getElementById('energyPieChart').getContext('2d');
    
    // Organize data into day periods
    const morningHours = hourlyData.filter(item => item.hour >= 5 && item.hour < 12);
    const afternoonHours = hourlyData.filter(item => item.hour >= 12 && item.hour < 17);
    const eveningHours = hourlyData.filter(item => item.hour >= 17 && item.hour < 22);
    const nightHours = hourlyData.filter(item => item.hour >= 22 || item.hour < 5);
    
    const morningCurrent = morningHours.reduce((sum, item) => sum + parseFloat(item.total_current), 0);
    const afternoonCurrent = afternoonHours.reduce((sum, item) => sum + parseFloat(item.total_current), 0);
    const eveningCurrent = eveningHours.reduce((sum, item) => sum + parseFloat(item.total_current), 0);
    const nightCurrent = nightHours.reduce((sum, item) => sum + parseFloat(item.total_current), 0);
    
    // Destroy existing chart if it exists
    if (energyPieChart) {
        energyPieChart.destroy();
    }
    
    // Create new pie chart
    energyPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Morning (5-12)', 'Afternoon (12-17)', 'Evening (17-22)', 'Night (22-5)'],
            datasets: [{
                data: [morningCurrent, afternoonCurrent, eveningCurrent, nightCurrent],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(249, 115, 22, 0.7)',
                    'rgba(55, 65, 81, 0.7)'
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(99, 102, 241)',
                    'rgb(249, 115, 22)',
                    'rgb(55, 65, 81)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e2e8f0'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value.toFixed(2)} A (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Navigation script with section animations
document.querySelectorAll('.sidebar a:not(#logoutBtn)').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active styles from all links
        document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active-nav'));
        this.classList.add('active-nav');

        const targetId = this.getAttribute('href').substring(1);
        
        // Hide all sections
        document.querySelectorAll('#home, #statistics, #users').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });

        // Show selected section
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            setTimeout(() => {
                targetSection.classList.add('active');
            }, 50);
        }
    });
});

// Account dropdown functionality
document.getElementById('accountBtn').addEventListener('click', function() {
    const dropdown = document.getElementById('accountDropdown');
    dropdown.classList.toggle('hidden');
    dropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const accountBtn = document.getElementById('accountBtn');
    const dropdown = document.getElementById('accountDropdown');
    
    if (!accountBtn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('show');
    }
});

// Logout functionality for both logout buttons
document.querySelectorAll('#logoutBtn, #logoutBtnDropdown').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
});

function logout() {
    const dashboardContainer = document.getElementById('dashboardContainer');
    const loginScreen = document.getElementById('loginScreen');
    const sidebar = document.querySelector('.sidebar');
    const dropdown = document.getElementById('accountDropdown');

    // Hide dashboard and dropdown
    dashboardContainer.classList.remove('active');
    dashboardContainer.classList.add('hidden');
    sidebar.classList.remove('active');
    dropdown.classList.add('hidden');
    dropdown.classList.remove('show');

    // Show login screen
    loginScreen.style.display = 'flex';

    // Clear input fields
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    // Reset current user
    currentLoggedInUser = null;
}

// Handle profile and settings links
document.getElementById('profileLink').addEventListener('click', function(e) {
    e.preventDefault();
    alert(`Profile for ${currentLoggedInUser.username}`);
    document.getElementById('accountDropdown').classList.add('hidden');
});

document.getElementById('settingsLink').addEventListener('click', function(e) {
    e.preventDefault();
    alert('Settings page');
    document.getElementById('accountDropdown').classList.add('hidden');
});

// Set up periodic data refresh every 60 seconds
setInterval(fetchDataAndUpdateDashboard, 60000);