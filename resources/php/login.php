<?php

require_once __DIR__ . '/bootstrap.php';

date_default_timezone_set("Asia/Kolkata");

require '../../PHPMailer/src/Exception.php';
require '../../PHPMailer/src/PHPMailer.php';
require '../../PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

include 'config.php';
include 'smtp.php';

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    include __DIR__ . '/db_init.php';

    // Check if the form is submitted
    if ($_SERVER["REQUEST_METHOD"] == "POST") {

        // normalized schema only

        if (isset($_POST["username"]) && isset($_POST["pwd"])) {
            // Retrieve form data
            $useridpt = htmlspecialchars(trim($_POST["username"])); // This is actually the userid
            $passwordpt = htmlspecialchars(trim($_POST["pwd"]));

            $checkQuery = "SELECT userid, username, email, password FROM users WHERE userid = ?";
            $checkStmt = $conn->prepare($checkQuery);
            $checkStmt->bind_param("i", $useridpt);
            $checkStmt->execute();
            $checkStmt->store_result();
            $userId = $username = $email = $password = null;
            $checkStmt->bind_result($userId, $username, $email, $password);
            $checkStmt->fetch();

            if ($checkStmt->num_rows > 0) {
                if (($useridpt == $userId) && ($password !== null) && (password_verify($passwordpt, $password))) {
                    // Store user data in the session
                    $_SESSION['username'] = $username;
                    $_SESSION['email'] = $email;
                    $_SESSION['userId'] = $userId;

                    $otppt = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

                    $mail = new PHPMailer(true);

                    try {
                        //Server settings
                        $mail->SMTPDebug = 0;
                        $mail->isSMTP();
                        $mail->Host = $smtphost;
                        $mail->SMTPAuth = true;
                        $mail->Username = $smtpusername;
                        $mail->Password = $smtppassword;
                        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                        $mail->Port = $smtpport;

                        //Recipients
                        $mail->setFrom($smtpusername, 'Foodelight');
                        $mail->addAddress($email);

                        //Content
                        $mail->isHTML(true);
                        $mail->Subject = 'Login Authentication';
                        $mail->Body    = "Hi " . $username . ",<br><br>Your OTP for Login is: " . $otppt . "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to login to Foodelight.<br><br>Thanks,<br>Foodelight";

                        $result = $mail->send();

                        if ($result) {
                            echo 'OTP has been sent to your email';

                            $expiresAt = date('Y-m-d H:i:s', time() + 120);
                            $isUsed = 0;
                            $insertOtp = $conn->prepare("INSERT INTO otp (userid, otp, expires_at, is_used) VALUES (?, ?, ?, ?)");
                            $insertOtp->bind_param("issi", $userId, $otppt, $expiresAt, $isUsed);
                            $insertOtp->execute();
                            $insertOtp->close();
                        } else {
                            echo "ERROR";
                        }

                    } catch (Exception $e) {
                        echo 'Message could not be sent. Mailer Error: ', $mail->ErrorInfo;
                    }
                } else {
                    echo "Invalid credentials";
                }

            } else {
                echo "Invalid credentials";
            }
            $checkStmt->close();

        } else if (isset($_POST["resend_login_otp"])) {
            $userId = $_SESSION['userId'] ?? null;
            $username = $_SESSION['username'] ?? null;
            $email = $_SESSION['email'] ?? null;

            if (!$userId || !$username || !$email) {
                echo "Session expired or invalid. Please login again.";
                exit;
            }

            $otppt = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $mail = new PHPMailer(true);
            try {
                $mail->SMTPDebug = 0;
                $mail->isSMTP();
                $mail->Host = $smtphost;
                $mail->SMTPAuth = true;
                $mail->Username = $smtpusername;
                $mail->Password = $smtppassword;
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = $smtpport;

                $mail->setFrom($smtpusername, 'Foodelight');
                $mail->addAddress($email);

                $mail->isHTML(true);
                $mail->Subject = 'Login Authentication';
                $mail->Body    = "Hi " . $username . ",<br><br>Your OTP for Login is: " . $otppt . "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to login to Foodelight.<br><br>Thanks,<br>Foodelight";

                $result = $mail->send();
                if ($result) {
                    echo 'OTP has been sent to your email';

                    $expiresAt = date('Y-m-d H:i:s', time() + 120);
                    $isUsed = 0;
                    $insertOtp = $conn->prepare("INSERT INTO otp (userid, otp, expires_at, is_used) VALUES (?, ?, ?, ?)");
                    $insertOtp->bind_param("issi", $userId, $otppt, $expiresAt, $isUsed);
                    $insertOtp->execute();
                    $insertOtp->close();
                } else {
                    echo "ERROR";
                }
            } catch (Exception $e) {
                echo 'Message could not be sent. Mailer Error: ', $mail->ErrorInfo;
            }

        } else if (isset($_POST["otp"])) {
            try {
                $userid = $_SESSION['userId'];
                $otp = $_POST["otp"];

                $checkStmt = $conn->prepare("SELECT id FROM otp WHERE userid = ? AND otp = ? AND is_used = 0 AND NOW() <= expires_at");
                $checkStmt->bind_param("is", $userid, $otp);
                $checkStmt->execute();
                $result = $checkStmt->get_result();

                if ($result->num_rows > 0) {
                    $otpRow = $result->fetch_assoc();
                    $otp_id = $otpRow['id'];

                    $updateStmt = $conn->prepare("UPDATE otp SET is_used = 1 WHERE id = ?");
                    $updateStmt->bind_param("i", $otp_id);
                    $updateStmt->execute();
                    $updateStmt->close();

                    echo "OTP is valid.";

                    $event = "Login to Foodelight";
                    $insertQuery = "INSERT INTO activity_log (userid, event) VALUES (?, ?)";
                    $insertStmt = $conn->prepare($insertQuery);
                    $insertStmt->bind_param("is", $userid, $event);
                    if(!$insertStmt->execute()) {
                        throw new Exception("Error: " . $insertStmt->error);
                    }
                    $insertStmt->close();
                } else {
                    echo "Invalid OTP!";
                }
                $checkStmt->close();
            } catch (Exception $e) {
                die("Error: " . $e->getMessage());
            }
        } else if (isset($_POST["username"])) {
            $useridpt = htmlspecialchars(trim($_POST["username"]));

            $checkQuery = "SELECT userid FROM users WHERE userid = ?";
            $checkStmt = $conn->prepare($checkQuery);
            $checkStmt->bind_param("i", $useridpt);
            $checkStmt->execute();
            $checkStmt->store_result();

            if ($checkStmt->num_rows > 0) {
                echo "Account Found!";
            } else {
                echo "Account Not Found! Please create your account.";
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
?>