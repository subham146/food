<?php

require_once __DIR__ . '/bootstrap.php';

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
        if(isset($_POST['id']))  {

            $id = $_POST['id'];

            // Delete from users table (cascades to all related tables)
            $sqlUser = "DELETE FROM users WHERE userid = ?";
            $stmtUser = $conn->prepare($sqlUser);
            $stmtUser->bind_param("i", $id);
            $stmtUser->execute();

            if($stmtUser->affected_rows > 0) {
                echo 1; // success

            } else {
                echo "Something Went Wrong"; // failure
            }
            $stmtUser->close();
        }
    }

} catch (Exception $e) {
    echo  $e->getMessage(), "\n";
}

?>