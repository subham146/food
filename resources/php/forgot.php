<?php

session_start();

date_default_timezone_set("Asia/Kolkata");

require_once __DIR__ . '/mail/Exception.php';
require_once __DIR__ . '/mail/PHPMailer.php';
require_once __DIR__ . '/mail/SMTP.php';


require_once __DIR__ . '/config.php';
require_once __DIR__ . '/smtp.php';
include __DIR__ . '/db_init.php';

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    if ($_SERVER["REQUEST_METHOD"] == "POST") {

        // normalized schema only

        // Step 1: Request OTP
        if (isset($_POST["email"])) {
            $emailpt = htmlspecialchars(trim($_POST["email"]));

            $checkQuery = "SELECT userid, username, email FROM users WHERE email = ?";
            $checkStmt = $conn->prepare($checkQuery);
            $checkStmt->bind_param("s", $emailpt);
            $checkStmt->execute();
            $checkStmt->store_result();
            $checkStmt->bind_result($userId, $username, $email);
            $checkStmt->fetch();

            if ($checkStmt->num_rows() > 0) {
                $_SESSION['userid'] = $userId;
                $_SESSION['email'] = $email;

                $otppt = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

                try {
                    $mail->SMTPDebug = 0;
                    $mail->isSMTP();
                    $mail->Host = $smtphost;
                    $mail->SMTPAuth = true;
                    $mail->Username = $smtpusername;
                    $mail->Password = $smtppassword;
                    $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                    $mail->Port = $smtpport;

                    $mail->setFrom($smtpusername, 'Foodelight');
                    $mail->addAddress($emailpt);

                    $mail->isHTML(true);
                    $mail->Subject = 'Reset Password';
                    $mail->Body = "Hi " . $username . ",<br><br>Your OTP for password reset is: " . $otppt . "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to reset your password.<br><br>Thanks,<br>Foodelight";

                    $result = $mail->send();

                    if ($result == 1) {
                        $expiresAt = date('Y-m-d H:i:s', time() + 120);
                        $isUsed = 0;
                        $insertOtp = $conn->prepare("INSERT INTO otp(userid, otp, expires_at, is_used) VALUES (?, ?, ?, ?)");
                        $insertOtp->bind_param("issi", $userId, $otppt, $expiresAt, $isUsed);
                        $insertOtp->execute();
                        $insertOtp->close();

                        // Keep string EXACTLY as JS expects
                        echo "OTP has been sent to your email";
                    } else {
                        echo "ERROR sending OTP email.";
                    }

                } catch (Exception $e) {
                    echo 'Message could not be sent. Mailer Error: ', $mail->ErrorInfo;
                }
            } else {
                echo "Account not Found!";
            }
            $checkStmt->close();

        // Step 2: Verify OTP
        } else if (isset($_POST["otp"])) {
            $userid = $_SESSION['userid'] ?? null;
            $otp = $_POST["otp"];

            if (!$userid) {
                throw new Exception("Session expired or invalid. Please try again.");
            }

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
                // Here you can proceed to allow password reset

            } else {
                echo "Invalid OTP!";
            }
            $checkStmt->close();

        } else {
            throw new Exception("Error: One or more form fields are missing.");
        }
    }

    $conn->close();
} catch (Exception $e) {
    echo $e->getMessage(), "\n";
}
?>
