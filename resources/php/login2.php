<?php

session_start();

date_default_timezone_set("Asia/Kolkata");

require_once __DIR__ . '/mail/Exception.php';
require_once __DIR__ . '/mail/PHPMailer.php';
require_once __DIR__ . '/mail/SMTP.php';


require_once __DIR__ . '/config.php';
require_once __DIR__ . '/smtp.php';

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Check if the form is submitted
    if ($_SERVER["REQUEST_METHOD"] == "POST") {

        if (isset($_POST["username"]) && isset($_POST["pwd"])) {
            // Retrieve form data
            $usernamept = htmlspecialchars(trim($_POST["username"]));
            $passwordpt = htmlspecialchars(trim($_POST["pwd"]));

            $checkQuery = "SELECT adminid, username, password, email FROM admin WHERE username = ?";
            if (!($checkStmt = $conn->prepare($checkQuery))) {
                throw new Exception("Prepare failed: (" . $conn->errno . ") " . $conn->error);
            }
            if (!$checkStmt->bind_param("s", $usernamept)) {
                throw new Exception("Binding parameters failed: (" . $checkStmt->errno . ") " . $checkStmt->error);
            }
            if (!$checkStmt->execute()) {
                throw new Exception("Execute failed: (" . $checkStmt->errno . ") " . $checkStmt->error);
            }
            $checkStmt->store_result();
            $checkStmt->bind_result($adminid, $username, $password, $email);
            $checkStmt->fetch();

            if ($checkStmt->num_rows() > 0) {
                if (($usernamept == $username) && ($password !== null) && (password_verify($passwordpt, $password))) {

                    // Store admin data in the session
                    $_SESSION['adminid'] = $adminid;
                    $_SESSION['username'] = $username;
                    $_SESSION['email'] = $email;

                    $otppt = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

                    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

                    try {
                        //Server settings
                        $mail->SMTPDebug = 0;
                        $mail->isSMTP();
                        $mail->Host = $smtphost;
                        $mail->SMTPAuth = true;
                        $mail->Username = $smtpusername;
                        $mail->Password = $smtppassword;
                        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                        $mail->Port = $smtpport;

                        //Recipients
                        $mail->setFrom($smtpusername, 'Foodelight');
                        $mail->addAddress($email);

                        //Content
                        $mail->isHTML(true);
                        $mail->Subject = 'Login Authentication for Admin';
                        $mail->Body    = "Hi " . $username . ",<br><br>Your OTP for Login is: " . $otppt . "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to login to Foodelight.<br><br>Thanks,<br>Foodelight";

                        $result = $mail->send();
                        if ($result == 1) {
                            echo 'OTP has been sent to your email';

                            // Insert OTP for this adminid in admin_otp table
                            $expiresAt = date('Y-m-d H:i:s', time() + 120);
                            $isUsed = 0;
                            $checkQuery1 = "INSERT INTO admin_otp(adminid, otp, expires_at, is_used) VALUES (?, ?, ?, ?)";
                            if (!($checkStmt1 = $conn->prepare($checkQuery1))) {
                                throw new Exception("Prepare failed: (" . $conn->errno . ") " . $conn->error);
                            }
                            if (!$checkStmt1->bind_param("iisi", $adminid, $otppt, $expiresAt, $isUsed)) {
                                throw new Exception("Binding parameters failed: (" . $checkStmt1->errno . ") " . $checkStmt1->error);
                            }
                            if (!$checkStmt1->execute()) {
                                throw new Exception("Error: " . $checkStmt1->error);
                            }
                            $checkStmt1->close();

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

        } else if (isset($_POST["otp"])) {
            try {
                $adminid = $_SESSION['adminid'] ?? null;
                if (!$adminid) {
                    throw new Exception("Admin ID missing from session.");
                }
                $checkStmt = $conn->prepare("SELECT id FROM admin_otp WHERE adminid = ? AND otp = ? AND is_used = 0 AND NOW() <= expires_at");
                if ($checkStmt === false) {
                    throw new Exception($conn->error);
                }
                $checkStmt->bind_param("ii", $adminid, $_POST["otp"]);
                $checkStmt->execute();
                $result = $checkStmt->get_result();

                if ($result->num_rows > 0) {
                    $row = $result->fetch_assoc();
                    $otpId = $row['id'];

                    $updateStmt = $conn->prepare("UPDATE admin_otp SET is_used = 1 WHERE id = ?");
                    if ($updateStmt === false) {
                        throw new Exception($conn->error);
                    }
                    $updateStmt->bind_param("i", $otpId);
                    $updateStmt->execute();

                    echo "Admin Login Success";

                } else {
                    echo "Invalid OTP!";
                }
            } catch (Exception $e) {
                die("Error: " . $e->getMessage());
            }
        } else {
            throw new Exception("Error: One or more form fields are missing.");
        }
    }

    // Close the database connection
    $conn->close();
} catch (Exception $e) {
    echo  $e->getMessage(), "\n";
}
?>