<?php

require_once __DIR__ . '/bootstrap.php';

date_default_timezone_set("Asia/Kolkata");

require_once __DIR__ . '/../../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../../PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/smtp.php';

function generate_unique_userid(mysqli $conn): int {
    $stmt = $conn->prepare("SELECT userid FROM users WHERE userid = ?");
    if (!$stmt) {
        // Fallback: best effort
        return random_int(100000, 999999);
    }

    $tries = 0;
    $userid = random_int(100000, 999999);
    while ($tries < 25) {
        $stmt->bind_param('i', $userid);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows === 0) {
            $stmt->close();
            return $userid;
        }
        $userid = random_int(100000, 999999);
        $tries++;
    }

    $stmt->close();
    return $userid;
}

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception('Connection failed: ' . $conn->connect_error);
    }

    require_once __DIR__ . '/db_init.php';

    if ($_SERVER["REQUEST_METHOD"] == "POST") {

        if (isset($_POST["name"]) && isset($_POST["email"]) && isset($_POST["pwd2"])) {
            $username = htmlspecialchars($_POST["name"]);
            $email = htmlspecialchars($_POST["email"]);
            $password = htmlspecialchars($_POST["pwd2"]);

            $_SESSION['username'] = $username;
            $_SESSION['email'] = $email;
            $_SESSION['password'] = $password;

            // Check if username or email already exists
            $checkQuery = "SELECT userid FROM users WHERE username = ? OR email = ?";
            $checkStmt = $conn->prepare($checkQuery);
            $checkStmt->bind_param("ss", $username, $email);
            $checkStmt->execute();
            $checkStmt->store_result();

            if ($checkStmt->num_rows > 0) {
                echo "Username or Email is already taken. Please choose a different one.";
            } else {
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
                    $mail->Subject = 'Signup to Foodelight';
                    $mail->Body    = "Hi " . $username . ",<br><br>Your OTP for Signing Up is: " . $otppt . "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to create your account.<br><br>Thanks,<br>Foodelight";

                    $result = $mail->send();

                    if ($result) {
                        // Store OTP in session for signup (avoids FK issues before user exists)
                        $_SESSION['signup_otp'] = $otppt;
                        $_SESSION['signup_otp_expires_at'] = time() + 120;
                        $_SESSION['signup_otp_verified'] = false;

                        echo 'OTP has been sent to your email';
                    } else {
                        echo "ERROR sending OTP email.";
                    }

                } catch (Exception $e) {
                    echo 'Message could not be sent. Mailer Error: ', $mail->ErrorInfo;
                }
            }

        } else if (isset($_POST["resend_signup_otp"])) {
            $username = $_SESSION['username'] ?? null;
            $email = $_SESSION['email'] ?? null;
            $password = $_SESSION['password'] ?? null;

            if (!$username || !$email || !$password) {
                echo "Session expired or invalid. Please try again.";
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
                $mail->Subject = 'Signup to Foodelight';
                $mail->Body    = "Hi " . $username . ",<br><br>Your OTP for Signing Up is: " . $otppt . "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to create your account.<br><br>Thanks,<br>Foodelight";

                $result = $mail->send();
                if ($result) {
                    $_SESSION['signup_otp'] = $otppt;
                    $_SESSION['signup_otp_expires_at'] = time() + 120;
                    $_SESSION['signup_otp_verified'] = false;
                    echo 'OTP has been sent to your email';
                } else {
                    echo "ERROR sending OTP email.";
                }
            } catch (Exception $e) {
                echo 'Message could not be sent. Mailer Error: ', $mail->ErrorInfo;
            }

        } else if (isset($_POST["create_account"])) {
            try {
                $username = $_SESSION['username'] ?? null;
                $email = $_SESSION['email'] ?? null;
                $password = $_SESSION['password'] ?? null;
                $expiresAt = $_SESSION['signup_otp_expires_at'] ?? null;
                $isVerified = $_SESSION['signup_otp_verified'] ?? false;

                if (!$username || !$email || !$password || !$expiresAt) {
                    throw new Exception("Session expired or invalid. Please try again.");
                }

                if (time() > (int)$expiresAt) {
                    throw new Exception("OTP expired. Please resend OTP.");
                }

                if (!$isVerified) {
                    throw new Exception("Please verify OTP first.");
                }

                // Finalize signup
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $conn->begin_transaction();

                $userId = generate_unique_userid($conn);
                $insertUser = $conn->prepare("INSERT INTO users (userid, username, email, password) VALUES (?, ?, ?, ?)");
                if ($insertUser === false) {
                    throw new Exception($conn->error);
                }
                $insertUser->bind_param("isss", $userId, $username, $email, $hashedPassword);
                if (!$insertUser->execute()) {
                    throw new Exception("Error: " . $insertUser->error);
                }
                $insertUser->close();

                // Send UserID email
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
                    $mail->Subject = 'Foodelight details';
                    $mail->Body    = "Hi " . $username . ",<br><br>Your UserID for Foodelight: " . $userId . "<br><br>UserID can be referenced in the future.<br><br>Thanks,<br>Foodelight";

                    $mail->send();
                } catch (Exception $e) {
                    // ignore mail errors, still create account
                }

                $event = "Signup to Foodelight";
                $insertLog = $conn->prepare("INSERT INTO activity_log (userid, event) VALUES (?, ?)");
                if ($insertLog) {
                    $insertLog->bind_param("is", $userId, $event);
                    $insertLog->execute();
                    $insertLog->close();
                }

                $conn->commit();

                unset(
                    $_SESSION['signup_otp'],
                    $_SESSION['signup_otp_expires_at'],
                    $_SESSION['signup_otp_verified']
                );

                echo 'UserID has been sent to your email';
            } catch (Exception $e) {
                try {
                    $conn->rollback();
                } catch (Exception $rollbackErr) {
                    // ignore
                }
                echo "Error: " . $e->getMessage();
            }

        } else if (isset($_POST["otp"])) {
            try {
                $username = $_SESSION['username'] ?? null;
                $email = $_SESSION['email'] ?? null;
                $password = $_SESSION['password'] ?? null;
                $expectedOtp = $_SESSION['signup_otp'] ?? null;
                $expiresAt = $_SESSION['signup_otp_expires_at'] ?? null;

                if (!$username || !$email || !$password || !$expectedOtp || !$expiresAt) {
                    throw new Exception("Session expired or invalid. Please try again.");
                }

                if (time() > (int)$expiresAt) {
                    echo "Invalid OTP!";
                    exit;
                }

                if (hash_equals((string)$expectedOtp, (string)$_POST["otp"])) {
                    $_SESSION['signup_otp_verified'] = true;
                    echo 'OTP verified';

                } else {
                    echo "Invalid OTP!";
                }
            } catch (Exception $e) {
                if ($conn && $conn->errno === 0) {
                    // no-op
                }
                echo "Error: " . $e->getMessage();
            }
        } else if (isset($_POST["name"])) {
            $username = htmlspecialchars($_POST["name"]);
            $checkQuery = "SELECT userid FROM users WHERE username = ?";
            $checkStmt = $conn->prepare($checkQuery);
            $checkStmt->bind_param("s", $username);
            $checkStmt->execute();
            $checkStmt->store_result();

            if ($checkStmt->num_rows > 0) {
                echo "Username already taken. Please choose a different one.";
            } else {
                echo "Username available.";
            }
        } else {
            throw new Exception("Error: One or more form fields are missing2.");
        }
    }
    $conn->close();
} catch (Exception $e) {
    echo  $e->getMessage(), "\n";
}

?>
