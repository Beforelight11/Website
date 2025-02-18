// Predefined user credentials
const VALID_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'user', password: 'user123', role: 'user' }
];

// Initialize chart data
let consumptionChart;
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
            updateConsumptionChart(data);
        })
        .catch(error => {
            console.error('Error fetching consumption data:', error);
        });
    
    // Fetch efficiency metrics for dashboard cards
    fetch('data-fetcher.php?request=efficiency_metrics')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching efficiency metrics:', data.error);
                return;
            }
            
            // Update dashboard cards with real data
            updateDashboardCards(data);
        })
        .catch(error => {
            console.error('Error fetching efficiency metrics:', error);
        });
}

// Function to update the consumption chart with real data
function updateConsumptionChart(data) {
    const ctx = document.getElementById('consumptionChart').getContext('2d');
    
    // Extract data from API response
    const timeLabels = data.map(item => item.hour);
    const powerData = data.map(item => parseFloat(item.power));
    const voltageData = data.map(item => parseFloat(item.voltage));
    const currentData = data.map(item => parseFloat(item.current));
    const energyData = data.map(item => parseFloat(item.energy));
    
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
                    label: 'Power (W)',
                    data: powerData,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
                    label: 'Current (A)',
                    data: currentData,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y2'
                },
                {
                    label: 'Energy (kWh)',
                    data: energyData,
                    borderColor: 'rgb(249, 115, 22)',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y3',
                    hidden: true // Hidden by default to avoid overcrowding
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
                        text: 'Power (W)',
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
                        text: 'Current (A)',
                        color: '#e2e8f0'
                    }
                },
                y3: {
                    beginAtZero: true,
                    display: false, // Hidden by default
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: '#e2e8f0'
                    },
                    title: {
                        display: true,
                        text: 'Energy (kWh)',
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

// Function to update dashboard cards with real data
function updateDashboardCards(data) {
    // Update total consumption card
    if (data.total_consumption !== undefined) {
        const totalConsumption = parseFloat(data.total_consumption).toFixed(2);
        document.getElementById('totalConsumption').textContent = `${totalConsumption} kWh`;
    }
    
    // Update last week consumption comparison
    if (data.last_week_consumption !== undefined) {
        const lastWeekConsumption = parseFloat(data.last_week_consumption).toFixed(2);
        document.getElementById('lastWeekConsumption').textContent = `Last week: ${lastWeekConsumption} kWh`;
    }
    
    // Update peak hours card
    if (data.peak_hours !== undefined && data.peak_hours !== null) {
        document.getElementById('peakHours').textContent = data.peak_hours;
    } else {
        document.getElementById('peakHours').textContent = 'No peak detected';
    }
    
    // Update peak consumption
    if (data.peak_consumption !== undefined) {
        const peakConsumption = parseFloat(data.peak_consumption).toFixed(2);
        document.getElementById('peakConsumption').textContent = `Peak consumption: ${peakConsumption} kWh`;
    }
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
        document.querySelectorAll('#home, #users').forEach(section => {
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