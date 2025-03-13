<?php
header('Content-Type: application/json');

// Updated database connection
$host = "192.168.0.101";
$user = "tcpthesis2";      // Default XAMPP user
$password = "powersync#999";      // Empty by default in XAMPP
$database = "PWRSYNC"; // Change if needed

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
$range = $_GET['range'] ?? '24h';
$circuitBreaker = $_GET['circuit_breaker'] ?? '1'; // Default to CircuitBreaker1

// Determine which table to query based on circuit breaker parameter
$table = "CircuitBreaker" . $circuitBreaker;

switch ($request) {
    case 'consumption_data':
       // Determine time interval based on range
       $timeInterval = $range === '24h' ? '24 HOUR' : '7 DAY';
        
       // Fetch hourly/daily data
       if ($range === '24h') {
           $stmt = $pdo->prepare("
               SELECT 
                   DATE_FORMAT(Recorded_At, '%H:00') as hour,
                   AVG(Humidity) as humidity,
                   SUM(Humidity) as humidity_used,
                   MAX(CASE WHEN HOUR(Recorded_At) BETWEEN 13 AND 16 THEN 1 ELSE 0 END) as is_peak
               FROM $table 
               WHERE Recorded_At >= NOW() - INTERVAL 24 HOUR
               GROUP BY hour
               ORDER BY Recorded_At ASC
           ");
       } else {
           $stmt = $pdo->prepare("
               SELECT 
                   DATE_FORMAT(Recorded_At, '%Y-%m-%d') as day,
                   AVG(Humidity) as humidity,
                   SUM(Humidity) as humidity_used,
                   MAX(CASE WHEN HOUR(Recorded_At) BETWEEN 13 AND 16 THEN 1 ELSE 0 END) as is_peak
               FROM $table 
               WHERE Recorded_At >= NOW() - INTERVAL 7 DAY
               GROUP BY day
               ORDER BY Recorded_At ASC
           ");
       }
       
       $stmt->execute();
       $hourlyData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get peak humidity time
        $stmtPeak = $pdo->prepare("
            SELECT 
                Recorded_At as peak_time,
                Humidity as peak_humidity
            FROM $table 
            WHERE Recorded_At >= NOW() - INTERVAL $timeInterval
            ORDER BY Humidity DESC
            LIMIT 1
        ");
        $stmtPeak->execute();
        $peakData = $stmtPeak->fetch(PDO::FETCH_ASSOC);
        
        // Get average humidity
        $stmtAvg = $pdo->prepare("
            SELECT 
                AVG(Humidity) as avg_humidity
            FROM $table 
            WHERE Recorded_At >= NOW() - INTERVAL $timeInterval
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
        // Determine time interval based on range
        $timeInterval = $range === '24h' ? '24 HOUR' : '7 DAY';

        // Fetch statistics - removed AVG for Temp as requested
        $stmt = $pdo->prepare("
            SELECT 
                'Temperature' as metric,
                MIN(Temp) as minimum,
                MAX(Temp) as maximum,
                STDDEV(Temp) as std_dev
            FROM $table 
            WHERE Recorded_At >= NOW() - INTERVAL $timeInterval
            UNION
            SELECT 
                'Humidity' as metric,
                AVG(Humidity) as average,
                MIN(Humidity) as minimum,
                MAX(Humidity) as maximum,
                STDDEV(Humidity) as std_dev
            FROM $table 
            WHERE Recorded_At >= NOW() - INTERVAL $timeInterval
        ");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get hourly/daily average for pie chart
        if ($range === '24h') {
            $stmtHourly = $pdo->prepare("
                SELECT 
                    HOUR(Recorded_At) as hour,
                    SUM(Humidity) as total_humidity
                FROM $table 
                WHERE Recorded_At >= NOW() - INTERVAL 24 HOUR
                GROUP BY HOUR(Recorded_At)
                ORDER BY hour
            ");
        } else {
            $stmtHourly = $pdo->prepare("
                SELECT 
                    DATE_FORMAT(Recorded_At, '%Y-%m-%d') as day,
                    SUM(Humidity) as total_humidity
                FROM $table 
                WHERE Recorded_At >= NOW() - INTERVAL 7 DAY
                GROUP BY day
                ORDER BY day
            ");
        }
        $stmtHourly->execute();
        $hourlyData = $stmtHourly->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'stats' => $data,
            'hourly' => $hourlyData
        ]);
        break;

    case 'compare_breakers':
        // New case to compare data between circuit breakers
        $timeInterval = $range === '24h' ? '24 HOUR' : '7 DAY';
        
        // Get temperatures from both circuit breakers - removed AVG as requested
        $stmtTemp = $pdo->prepare("
            SELECT 
                'CircuitBreaker1' as source,
                MAX(Temp) as max_temp,
                MIN(Temp) as min_temp
            FROM CircuitBreaker1
            WHERE Recorded_At >= NOW() - INTERVAL $timeInterval
            UNION
            SELECT 
                'CircuitBreaker2' as source,
                MAX(Temp) as max_temp,
                MIN(Temp) as min_temp
            FROM CircuitBreaker2
            WHERE Recorded_At >= NOW() - INTERVAL $timeInterval
        ");
        $stmtTemp->execute();
        $tempData = $stmtTemp->fetchAll(PDO::FETCH_ASSOC);
        
        // Get average humidity from both circuit breakers
        $stmtHumidity = $pdo->prepare("
            SELECT 
                'CircuitBreaker1' as source,
                AVG(Humidity) as avg_humidity,
                MAX(Humidity) as max_humidity,
                MIN(Humidity) as min_humidity
            FROM CircuitBreaker1
            WHERE Recorded_At >= NOW() - INTERVAL $timeInterval
            UNION
            SELECT 
                'CircuitBreaker2' as source,
                AVG(Humidity) as avg_humidity,
                MAX(Humidity) as max_humidity,
                MIN(Humidity) as min_humidity
            FROM CircuitBreaker2
            WHERE Recorded_At >= NOW() - INTERVAL $timeInterval
        ");
        $stmtHumidity->execute();
        $humidityData = $stmtHumidity->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'temperature' => $tempData,
            'humidity' => $humidityData
        ]);
        break;

    default:
        echo json_encode(['error' => 'Invalid request type']);
}
?>