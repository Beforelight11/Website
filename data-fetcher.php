<?php
header('Content-Type: application/json');

// Updated database connection
$db_config = [
    'host' => '192.168.0.101',
    'dbname' => 'PWRSYNC',
    'user' => 'tcpthesis2',
    'password' => 'powersync#999'
];

try {
    $pdo = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['dbname']}", 
        $db_config['user'], 
        $db_config['password']
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['error' => 'Connection failed: ' . $e->getMessage()]));
}

// Get request type
$request = $_GET['request'] ?? '';

switch($request) {
    case 'consumption_data':
        // Fetch last 24 hours of consumption data with voltage, current, power and energy
        $stmt = $pdo->prepare("
            SELECT 
                DATE_FORMAT(timestamp, '%H:00') as hour,
                AVG(voltage) as voltage,
                AVG(current) as current,
                AVG(power) as power,
                SUM(energy) as energy,
                MAX(CASE WHEN HOUR(timestamp) BETWEEN 13 AND 16 THEN 1 ELSE 0 END) as is_peak
            FROM power_metrics 
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            GROUP BY DATE_FORMAT(timestamp, '%H:00')
            ORDER BY timestamp
        ");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($data);
        break;

    case 'statistics_data':
        // Fetch statistical data for parameters (voltage, current, power, energy)
        $stmt = $pdo->prepare("
            SELECT 
                'Voltage' as parameter,
                AVG(voltage) as average,
                MIN(voltage) as minimum,
                MAX(voltage) as maximum,
                STDDEV(voltage) as standard_deviation
            FROM power_metrics
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            
            UNION ALL
            
            SELECT 
                'Current' as parameter,
                AVG(current) as average,
                MIN(current) as minimum,
                MAX(current) as maximum,
                STDDEV(current) as standard_deviation
            FROM power_metrics
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            
            UNION ALL
            
            SELECT 
                'Power' as parameter,
                AVG(power) as average,
                MIN(power) as minimum,
                MAX(power) as maximum,
                STDDEV(power) as standard_deviation
            FROM power_metrics
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            
            UNION ALL
            
            SELECT 
                'Energy' as parameter,
                SUM(energy) as average,
                MIN(energy) as minimum,
                MAX(energy) as maximum,
                STDDEV(energy) as standard_deviation
            FROM power_metrics
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
        ");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($data);
        break;

    case 'hourly_distribution':
        // Fetch hourly distribution of power usage
        $stmt = $pdo->prepare("
            SELECT 
                HOUR(timestamp) as hour,
                AVG(power) as average_power,
                SUM(energy) as total_energy
            FROM power_metrics 
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR
            GROUP BY HOUR(timestamp)
            ORDER BY hour
        ");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($data);
        break;

    default:
        echo json_encode(['error' => 'Invalid request type']);
}
?>