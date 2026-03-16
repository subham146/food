<?php

require_once __DIR__ . '/cors.php';

require_once __DIR__ . '/config.php';
include __DIR__ . '/db_init.php';

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Check if the form is submitted
    if ($_SERVER["REQUEST_METHOD"] == "POST") {

        // normalized schema only

        if (isset($_POST["pwd2"]) && isset($_POST["pwd3"])) {
            // Retrieve form data
            $pwd = htmlspecialchars(trim($_POST["pwd2"]));
            $pwd3 = htmlspecialchars(trim($_POST["pwd3"]));

            $emailpt = $_SESSION['email'];

            $checkQuery = "SELECT userid, email FROM users WHERE email = ?";
            if (!($checkStmt = $conn->prepare($checkQuery))) {
                throw new Exception("Prepare failed: (" . $conn->errno . ") " . $conn->error);
            }
            if (!$checkStmt->bind_param("s", $emailpt)) {
                throw new Exception("Binding parameters failed: (" . $checkStmt->errno . ") " . $checkStmt->error);
            }
            if (!$checkStmt->execute()) {
                throw new Exception("Execute failed: (" . $checkStmt->errno . ") " . $checkStmt->error);
            }
            $checkStmt->store_result();
            $checkStmt->bind_result($userId, $email);
            $checkStmt->fetch();

            if ($checkStmt->num_rows() > 0) {
                try {
                    $hashedPassword = password_hash($pwd3, PASSWORD_DEFAULT);

                    // Prepare an UPDATE statement
                    $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
                    if ($updateStmt === false) {
                        throw new Exception("Prepare failed: (" . $conn->errno . ") " . $conn->error);
                    }
                    if (!$updateStmt->bind_param("ss", $hashedPassword, $emailpt)) {
                        throw new Exception("Binding parameters failed: (" . $updateStmt->errno . ") " . $updateStmt->error);
                    }
                    if (!$updateStmt->execute()) {
                        throw new Exception("Execute failed: (" . $updateStmt->errno . ") " . $updateStmt->error);
                    }

                    echo "Password updated successfully";

                    $event = "Reset Password";
                    $insertQuery = "INSERT INTO activity_log (userid, event) VALUES (?, ?)";
                    $insertStmt = $conn->prepare($insertQuery);
                    $insertStmt->bind_param("is", $userId, $event);
                    if(!$insertStmt->execute()) {
                        throw new Exception("Error: " . $insertStmt->error);
                    }
                    $insertStmt->close();

                } catch (Exception $e) {
                    echo $e->getMessage(), "\n";
                }

            } else {
                echo "Invalid credentials2";
            }
            $checkStmt->close();
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

session_destroy();

?>