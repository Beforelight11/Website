<?php
header('Content-Type: application/json');

// Updated database connection
$host = "localhost";
$user = "root";      // Default XAMPP user
$password = "";      // Empty by default in XAMPP
$database = "powersync"; // Change if needed

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$database;charset=utf8", $user, $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['error' => 'Connection failed: ' . $e->getMessage()]));
}

// Get request type
$request = $_GET['request'] ?? '';

switch($request) {
    case 'consumption_data':
        // Fetch last 24 hours of data with voltage, current, avg current, and peak timestamps
        $stmt = $pdo->prepare("
            SELECT 
                DATE_FORMAT(timestamp, '%H:00') as hour,
                AVG(voltage) as voltage,
                AVG(current) as current,
                SUM(current) as current_used,
                MAX(CASE WHEN HOUR(timestamp) BETWEEN 13 AND 16 THEN 1 ELSE 0 END) as is_peak
            FROM consumption_data 
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            GROUP BY hour
            ORDER BY timestamp ASC
        ");
        $stmt->execute();
        $hourlyData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get peak current time
        $stmtPeak = $pdo->prepare("
            SELECT 
                timestamp as peak_time,
                current as peak_current
            FROM consumption_data 
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            ORDER BY current DESC
            LIMIT 1
        ");
        $stmtPeak->execute();
        $peakData = $stmtPeak->fetch(PDO::FETCH_ASSOC);
        
        // Get average current
        $stmtAvg = $pdo->prepare("
            SELECT 
                AVG(current) as avg_current
            FROM consumption_data 
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
        ");
        $stmtAvg->execute();
        $avgData = $stmtAvg->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'hourly' => $hourlyData,
            'peak' => $peakData,
            'average' => $avgData
        ]);
        break;

    case 'statistics_data':
        // Fetch summary statistics for voltage and current metrics
        $stmt = $pdo->prepare("
            SELECT 
                'Voltage' as metric,
                AVG(voltage) as average,
                MIN(voltage) as minimum,
                MAX(voltage) as maximum,
                STDDEV(voltage) as std_dev
            FROM consumption_data 
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            UNION
            SELECT 
                'Current' as metric,
                AVG(current) as average,
                MIN(current) as minimum,
                MAX(current) as maximum,
                STDDEV(current) as std_dev
            FROM consumption_data 
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
        ");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get hourly average for pie chart
        $stmtHourly = $pdo->prepare("
            SELECT 
                HOUR(timestamp) as hour,
                SUM(current) as total_current
            FROM consumption_data 
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            GROUP BY HOUR(timestamp)
            ORDER BY hour
        ");
        $stmtHourly->execute();
        $hourlyData = $stmtHourly->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'stats' => $data,
            'hourly' => $hourlyData
        ]);
        break;

    default:
        echo json_encode(['error' => 'Invalid request type']);
}
?>