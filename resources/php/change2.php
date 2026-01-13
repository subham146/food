<?php

session_start();

include "config.php";

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Check if the form is submitted
    if ($_SERVER["REQUEST_METHOD"] == "POST") {

        if (isset($_POST["pwd2"]) && isset($_POST["pwd3"])) {
            // Retrieve form data
            $pwd = htmlspecialchars(trim($_POST["pwd2"]));
            $pwd3 = htmlspecialchars(trim($_POST["pwd3"]));

            $emailpt = $_SESSION['email'];

            $checkQuery = "SELECT * FROM admin WHERE email = ?";

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
            $checkStmt->bind_result($username, $email, $password, $adminid); // bind the result set columns to PHP variable
            $checkStmt->fetch();

            if ($checkStmt->num_rows() > 0) {
                try {

                    $hashedPassword = password_hash($pwd3, PASSWORD_DEFAULT);

                    // Prepare an UPDATE statement
                    $updateStmt = $conn->prepare("UPDATE admin SET password = ? WHERE email = ?");

                    // Check if the statement was prepared successfully
                    if ($updateStmt === false) {
                        throw new Exception("Prepare failed: (" . $conn->errno . ") " . $conn->error);
                    }

                    // Bind the new password and the email to the statement
                    if (!$updateStmt->bind_param("ss", $hashedPassword, $emailpt)) {
                        throw new Exception("Binding parameters failed: (" . $updateStmt->errno . ") " . $updateStmt->error);
                    }

                    // Execute the statement
                    if (!$updateStmt->execute()) {
                        throw new Exception("Execute failed: (" . $updateStmt->errno . ") " . $updateStmt->error);
                    }

                    echo "Password updated successfully";

                } catch (Exception $e) {
                    echo $e->getMessage(), "\n";
                }

            } else {
                echo "Invalid credentials2";
            }
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