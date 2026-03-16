<?php

require_once __DIR__ . '/cors.php';

date_default_timezone_set("Asia/Kolkata");

require_once __DIR__ . '/mail/Exception.php';
require_once __DIR__ . '/mail/PHPMailer.php';
require_once __DIR__ . '/mail/SMTP.php';


require_once __DIR__ . '/config.php';
require_once __DIR__ . '/smtp.php';

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

        if (isset($_POST["paymentData"]) && isset($_POST["fullName"]) && isset($_POST["phoneNumber"]) && isset($_POST['streetAddress']) && isset($_POST["city"]) && isset($_POST["state"]) && isset($_POST["pinCode"])) {
            
            $username = $_SESSION['username'];
            $email = $_SESSION['email'];
            $userid = $_SESSION['userId'] ?? null;

            if (!$userid) {
                throw new Exception("Not logged in.");
            }

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
                $mail->Subject = 'Payment Authentication';
                $mail->Body    = "Hi " . $username . ",<br><br>Your OTP for Payment is: " . $otppt . "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP for successful payment to the Foodelight.<br><br>Thanks,<br>Foodelight";
                
    
                $result = $mail->send();
                if ($result == 1) {
                    echo 'OTP has been sent to your email';

                    $expiresAt = date('Y-m-d H:i:s', time() + 120);
                    $isUsed = 0;

                    $insertOtp = $conn->prepare("INSERT INTO otp (userid, otp, expires_at, is_used) VALUES (?, ?, ?, ?)");
                    if ($insertOtp === false) {
                        throw new Exception($conn->error);
                    }
                    $insertOtp->bind_param("issi", $userid, $otppt, $expiresAt, $isUsed);
                    if (!$insertOtp->execute()) {
                        throw new Exception("Error: " . $insertOtp->error);
                    }
                    $insertOtp->close();

                } else {
                    echo "ERROR";
                }

            } catch (Exception $e) {
                echo 'Message could not be sent. Mailer Error: ', $mail->ErrorInfo;
            }


        }else if (isset($_POST["otp"])) {
            try {
                
                $username = $_SESSION['username'];
                $email = $_SESSION['email'];
                $goal = $_SESSION['goal'];
                $gender = $_SESSION['gender'];
                $days = $_SESSION['days'];
                $meal = $_SESSION['meal'];
                $diet = $_SESSION['diet'];
                $sty = $_SESSION['sty'];
                $choose = $_SESSION['choose'];
                $price = $_SESSION["tp"];
                $userid = $_SESSION['userId'];

                $transactionId = substr(bin2hex(random_bytes(8)), 0, 16);

                $durationDays = parse_duration_days((string) $days);

                $checkStmt = $conn->prepare("SELECT id FROM otp WHERE userid = ? AND otp = ? AND is_used = 0 AND NOW() <= expires_at");
                if ($checkStmt === false) {
                    throw new Exception($conn->error);
                }
                $checkStmt->bind_param("is", $userid, $_POST["otp"]);
                $checkStmt->execute();
                $result = $checkStmt->get_result();

                if ($result->num_rows > 0) {
                    $otpRow = $result->fetch_assoc();
                    $otpId = $otpRow['id'];

                    $conn->begin_transaction();

                    $updateStmt = $conn->prepare("UPDATE otp SET is_used = 1 WHERE id = ?");
                    if ($updateStmt === false) {
                        throw new Exception($conn->error);
                    }
                    $updateStmt->bind_param("i", $otpId);
                    if (!$updateStmt->execute()) {
                        throw new Exception("Error: " . $updateStmt->error);
                    }
                    $updateStmt->close();

                    // Create or find a plan that matches this selection
                    $planGoal = (string) $goal;
                    $planDiet = (string) $diet;
                    $planMealtype = (string) $choose;
                    $planPrice = (float) $price;

                    $planId = null;
                    $findPlan = $conn->prepare("SELECT planid FROM plans WHERE goal = ? AND diet = ? AND mealtype = ? AND duration_days = ? AND price = ? LIMIT 1");
                    if ($findPlan === false) {
                        throw new Exception($conn->error);
                    }
                    $findPlan->bind_param('sssdd', $planGoal, $planDiet, $planMealtype, $durationDays, $planPrice);
                    if ($findPlan->execute()) {
                        $findPlan->bind_result($planId);
                        $findPlan->fetch();
                    }
                    $findPlan->close();

                    if (!$planId) {
                        $insertPlan = $conn->prepare("INSERT INTO plans (goal, diet, mealtype, duration_days, price) VALUES (?, ?, ?, ?, ?)");
                        if ($insertPlan === false) {
                            throw new Exception($conn->error);
                        }
                        $insertPlan->bind_param('sssdd', $planGoal, $planDiet, $planMealtype, $durationDays, $planPrice);
                        if (!$insertPlan->execute()) {
                            throw new Exception("Error: " . $insertPlan->error);
                        }
                        $planId = $conn->insert_id;
                        $insertPlan->close();

                        // Attach meals (best-effort) if provided
                        $mealNames = array_filter(array_map('trim', preg_split('/,/', (string) $meal)));
                        foreach ($mealNames as $mealName) {
                            if ($mealName === '') {
                                continue;
                            }

                            $mealId = null;
                            $findMeal = $conn->prepare("SELECT mealid FROM meals WHERE meal_name = ? LIMIT 1");
                            if ($findMeal === false) {
                                throw new Exception($conn->error);
                            }
                            $findMeal->bind_param('s', $mealName);
                            if ($findMeal->execute()) {
                                $findMeal->bind_result($mealId);
                                $findMeal->fetch();
                            }
                            $findMeal->close();

                            if (!$mealId) {
                                $insertMeal = $conn->prepare("INSERT INTO meals (meal_name) VALUES (?)");
                                if ($insertMeal === false) {
                                    throw new Exception($conn->error);
                                }
                                $insertMeal->bind_param('s', $mealName);
                                if (!$insertMeal->execute()) {
                                    throw new Exception("Error: " . $insertMeal->error);
                                }
                                $mealId = $conn->insert_id;
                                $insertMeal->close();
                            }

                            $insertPlanMeal = $conn->prepare("INSERT IGNORE INTO plan_meals (planid, mealid) VALUES (?, ?)");
                            if ($insertPlanMeal === false) {
                                throw new Exception($conn->error);
                            }
                            $insertPlanMeal->bind_param('ii', $planId, $mealId);
                            if (!$insertPlanMeal->execute()) {
                                throw new Exception("Error: " . $insertPlanMeal->error);
                            }
                            $insertPlanMeal->close();
                        }
                    }

                    // Update user's gender (best-effort) to match selection
                    if ($gender) {
                        $genderValue = strtolower((string) $gender);
                        if (!in_array($genderValue, ['male', 'female', 'other'], true)) {
                            $genderValue = 'other';
                        }
                        $updateGender = $conn->prepare("UPDATE users SET gender = ? WHERE userid = ?");
                        if ($updateGender) {
                            $updateGender->bind_param('si', $genderValue, $userid);
                            $updateGender->execute();
                            $updateGender->close();
                        }
                    }

                    // Create subscription
                    $startDate = date('Y-m-d');
                    $endDate = date('Y-m-d', strtotime('+' . $durationDays . ' days'));
                    $status = 'active';
                    $insertSub = $conn->prepare("INSERT INTO subscriptions (userid, planid, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)");
                    if ($insertSub === false) {
                        throw new Exception($conn->error);
                    }
                    $insertSub->bind_param('iisss', $userid, $planId, $startDate, $endDate, $status);
                    if (!$insertSub->execute()) {
                        throw new Exception("Error: " . $insertSub->error);
                    }
                    $subscriptionId = $conn->insert_id;
                    $insertSub->close();

                    // Create transaction
                    $paymentMethod = 'otp';
                    $paymentStatus = 'success';
                    $insertTxn = $conn->prepare("INSERT INTO transactions (transactionid, subscriptionid, amount, payment_method, payment_status) VALUES (?, ?, ?, ?, ?)");
                    if ($insertTxn === false) {
                        throw new Exception($conn->error);
                    }
                    $insertTxn->bind_param('sidss', $transactionId, $subscriptionId, $planPrice, $paymentMethod, $paymentStatus);
                    if (!$insertTxn->execute()) {
                        throw new Exception("Error: " . $insertTxn->error);
                    }
                    $insertTxn->close();

                    // Activity log
                    $event = "Subscribed to Foodelight";
                    $insertLog = $conn->prepare("INSERT INTO activity_log (userid, event) VALUES (?, ?)");
                    if ($insertLog) {
                        $insertLog->bind_param('is', $userid, $event);
                        $insertLog->execute();
                        $insertLog->close();
                    }

                    $conn->commit();

                    echo "Your Order Successfully Placed";

                    // Confirmation email (non-transactional)
                    $mail2 = new \PHPMailer\PHPMailer\PHPMailer(true);

                    try {
                        $mail2->SMTPDebug = 0;
                        $mail2->isSMTP();
                        $mail2->Host = $smtphost;
                        $mail2->SMTPAuth = true;
                        $mail2->Username = $smtpusername;
                        $mail2->Password = $smtppassword;
                        $mail2->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                        $mail2->Port = $smtpport;

                        $mail2->setFrom($smtpusername, 'Foodelight');
                        $mail2->addAddress($email);

                        $mail2->isHTML(true);
                        $mail2->Subject = 'Welcome to Foodelight';
                        $mail2->Body    = "Hi " . $username . ", <br><br>Your Transaction Id is " . $transactionId . " and Subscription ID is " . $subscriptionId . " for your subscription plan.<br><br>Thanks,<br>Foodelight";

                        $mail2->send();
                    } catch (Exception $e) {
                        // ignore mail errors for payment flow
                    }

                } else {
                    echo "Invalid OTP!";
                }
            } catch (Exception $e) {
                if ($conn && $conn->errno === 0) {
                    // no-op
                }
                try {
                    $conn->rollback();
                } catch (Exception $rollbackErr) {
                    // ignore
                }
                die("Error: " . $e->getMessage());
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
?>