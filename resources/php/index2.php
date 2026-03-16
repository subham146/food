<?php

require_once __DIR__ . '/cors.php';

require_once __DIR__ . '/config.php';

function parse_duration_days(string $raw): int {
    $raw = trim($raw);
    if ($raw === '') {
        return 3;
    }
    if (preg_match('/^(\d+)\s*d$/i', $raw, $m)) {
        return max(1, (int)$m[1]);
    }
    if (preg_match('/^(\d+)\s*w$/i', $raw, $m)) {
        return max(1, (int)$m[1]) * 7;
    }
    if (ctype_digit($raw)) {
        return max(1, (int)$raw);
    }
    if ($raw === '4w') {
        return 28;
    }
    if ($raw === '2w') {
        return 14;
    }
    if ($raw === '3d') {
        return 3;
    }
    return 3;
}

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Check if the form is submitted
    if ($_SERVER["REQUEST_METHOD"] == "POST") {

        if (
            isset($_POST["goal"]) && isset($_POST["gender"]) && isset($_POST["days"]) &&
            isset($_POST["meal"]) && isset($_POST["diet"]) && isset($_POST["sty"]) && isset($_POST["choose"])
        ) {
            // Retrieve form data
            $goal = htmlspecialchars(trim($_POST["goal"]));
            $gender = htmlspecialchars(trim($_POST["gender"]));
            $days = htmlspecialchars(trim($_POST["days"]));
            $meal = htmlspecialchars(trim($_POST["meal"]));
            $diet = htmlspecialchars(trim($_POST["diet"]));
            $sty = htmlspecialchars(trim($_POST["sty"]));
            $choose = isset($_POST["choose"]) ? array_map(function($value) {
                return htmlspecialchars(trim($value));
            }, $_POST["choose"]) : [];
            $useridpt = $_SESSION['userId']; // Use userid from session

            $choose_string = implode(', ', $choose);

            // Normalized schema: check active subscription by userid
            $durationDays = parse_duration_days((string) $days);
            $checkQuery2 = "SELECT subscriptionid FROM subscriptions WHERE userid = ? AND status = 'active' AND CURDATE() <= end_date LIMIT 1";
            $checkStmt2 = $conn->prepare($checkQuery2);
            $checkStmt2->bind_param("i", $useridpt);
            $checkStmt2->execute();
            $checkStmt2->store_result();

            if ($checkStmt2->num_rows > 0) {
                // An active subscription already exists, do not insert a new one
                echo "You already have an active subscription.";
            } else {

                $_SESSION['goal'] = $goal;
                $_SESSION['gender'] = $gender;
                $_SESSION['days'] = $days;
                $_SESSION['meal'] = $meal;
                $_SESSION['diet'] = $diet;
                $_SESSION['sty'] = $sty;
                $_SESSION['choose'] = $choose_string;
                $_SESSION['duration_days'] = $durationDays;

                echo "Redirecting to payment Page...";
            }
            $checkStmt2->close();

        } else if (isset($_POST['price'])) {
            $_SESSION['price'] = $_POST['price'];

        } else {
            // Handle case where one or more keys are not set
            throw new Exception("Error: One or more form fields are missing.");
        }

    }

    // Close the database connection
    $conn->close();
} catch (Exception $e) {
    echo  $e->getMessage(), "\n";
}

?>