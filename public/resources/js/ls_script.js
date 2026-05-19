$(document).on('click', 'ion-icon.small', function () {
    var $icon = $(this);
    var $input = $icon.siblings('input').first();

    if (!$input.length) return;

    var currentType = ($input.attr('type') || '').toLowerCase();
    var nextType = currentType === 'password' ? 'text' : 'password';
    $input.attr('type', nextType);
    $icon.attr('name', nextType === 'password' ? 'eye-off-outline' : 'eye-outline');
});

$(document).ready(function() {
  const password1 = $("#pwd1");
  const password2 = $("#pwd2");
  const email = $('#email');
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  // Password policy: at least one uppercase letter, one lowercase letter, one special character, and one number
  var passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/;
  const submitBtn = $("#submit-btn");

    // Signup flow state
    // stage: 'collect' -> send OTP, 'otp_sent' -> waiting for verify, 'otp_verified' -> allow create_account
    submitBtn.data('stage', 'collect');

  // Enable the button initially
  submitBtn.prop("disabled", false);

  // Add event listeners to both password fields
  email.on("focusout", checkPasswords);
  password1.on("focusout", checkPasswords);
  password2.on("input", checkPasswords);

function checkPasswords() {

    if (!email.val()) {
        submitBtn.prop("disabled", true);
        $("#error-message").text('Email address is required').show();
        return;
    }

    if (!emailRegex.test(email.val())) {
        $("#pwd2").prop("disabled", true);
        $("#pwd1").prop("disabled", true);
        submitBtn.prop("disabled", true);
        $("#error-message").text('Invalid email address').show();
        return;
    }

    $("#pwd1").prop("disabled", false);

    if (!passwordPolicy.test(password1.val())) {
        $("#pwd2").prop("disabled", true);
        submitBtn.prop("disabled", true);
        $("#error-message").text('Password should be 8 to 16 characters, with at least one uppercase letter, one lowercase letter, one special character, and one number.').show();
        return;
    }

    $("#pwd2").prop("disabled", false);

    if (password1.val() === password2.val()) {
        // Only enable while collecting details (OTP not sent yet)
        submitBtn.prop("disabled", submitBtn.data('stage') !== 'collect');
        $("#error-message").text('').hide();
    } else if (password1.val().length == 0 && password2.val().length == 0) {
        $("#error-message").text('').hide();
        submitBtn.prop("disabled", submitBtn.data('stage') !== 'collect');
    } else {
        submitBtn.prop("disabled", true);
        $("#error-message").text('Passwords do not match').show();
    }
}

});

$("#email, #pwd1, #pwd2, #otp").on("input", function() {
    $("#error-message").text('').hide();
});



$("#name").on("input",function() {
    var input=$(this);
    var username = input.val();

    if (username === "") {
        $("#error1-message").text('').hide();
        $("#submit-btn").prop('disabled', false);
        return;
    }

    
    var re = /^[a-z]+$/i;
    var re1 = /^[a-z0-9]+$/i;
    var re2 = /^[0-9]+$/;
    var is_alphanumeric=re1.test(input.val());
    var is_alphabetic=re.test(input.val());
    var is_numeric=re2.test(input.val());
    if((is_alphabetic || is_alphanumeric) && !is_numeric){

        $.ajax({
            url: "python/signup.py", // replace with the URL of your script that checks if a username is available
            type: "POST",
            data: { name: username },
            success: function(response) {
                if (response === "Username already taken. Please choose a different one.") {
                    $("#error1-message").text(response).show();
                    $("#submit-btn").prop('disabled', true);
                } else {
                    $("#error1-message").text('').hide();
                    $("#submit-btn").prop('disabled', false);
                }
            }
        });
    }else{
        $("#error1-message").text('Username should be Alphabetic or Alphanumeric only').show();
        $("#submit-btn").prop('disabled', true);
    }
});

$(document).ready(function() {
    $("#submit-btn").click(function(e) {
        e.preventDefault();

        var timerInterval = null;
        var otpExpiresAt = null;
        var otpExpired = false;
        var sendingOtpTimeout = null;

        function setVerifyMode() {
            otpExpired = false;
            $("#verify-btn").val("Verify").prop("disabled", false);
        }

        function setResendMode() {
            otpExpired = true;
            $("#verify-btn").val("Remit").prop("disabled", false);
        }

        function startSignupOtpTimer() {
            clearSignupOtpTimer();
            otpExpiresAt = Date.now() + 120000;
            $("#resend-row").hide();
            setVerifyMode();
            renderSignupOtpTimer();
            timerInterval = setInterval(renderSignupOtpTimer, 1000);
        }

        function clearSignupOtpTimer() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            otpExpiresAt = null;
        }

        function renderSignupOtpTimer() {
            var timerElement = $("#timer");
            if (!otpExpiresAt) {
                timerElement.text("");
                return;
            }

            var remainingMs = otpExpiresAt - Date.now();
            if (remainingMs <= 0) {
                clearSignupOtpTimer();
                timerElement.text("Time's up!");
                setResendMode();
                return;
            }

            var totalSeconds = Math.ceil(remainingMs / 1000);
            var minutes = Math.floor(totalSeconds / 60);
            var seconds = totalSeconds % 60;
            if (seconds < 10) {
                seconds = "0" + seconds;
            }
            timerElement.text("Time left: " + minutes + ":" + seconds);
        }

        if (window.location && window.location.protocol === 'file:') {
            $("#error-message").text("Error: Open this page via a web server (e.g., http://localhost/...), not as a file.").show();
            $(this).prop('disabled', false);
            return;
        }
    
        // Disable the button
        $(this).prop('disabled', true);

        function setMessage($el, text) {
            var next = String(text || "");
            if ($el.is(":visible") && $el.text() === next) {
                return;
            }
            $el.text(next).show();
        }

        function normalizeMessage(text, type) {
            var raw = String(text || "").trim();
            if (!raw) {
                return type === "error" ? "Something went wrong. Please try again." : "";
            }

            var map = {
                "Sending OTP...": "Sending signup OTP to your email. Please wait...",
                "OTP has been sent to your email": "Signup OTP sent. Check your inbox or spam and enter it within 2 minutes.",
                "OTP verified": "OTP verified. You can now create your account.",
                "OTP verified successfully.": "OTP verified. You can now create your account.",
                "UserID has been sent to your email": "Account created. Your UserID has been sent to your email.",
                "Invalid OTP!": "That OTP does not match. Please recheck and try again.",
                "Error: Please enter the OTP.": "Please enter the OTP to continue.",
                "Error: Remit request failed.": "Could not send a fresh OTP right now. Please try Remit again.",
                "Error: Create account request failed.": "Could not complete account creation right now. Please try again.",
                "Error: All fields are required. Ensure you check the terms & conditions.": "Complete all fields and accept terms and conditions to continue."
            };

            return map[raw] || raw;
        }

        function hideMessage($el) {
            if ($el.is(":visible")) {
                $el.text("").hide();
            }
        }

        function showSuccess(text) {
            hideMessage($("#error-message"));
            setMessage($("#success-message"), normalizeMessage(text, "success"));
        }

        function showError(text) {
            hideMessage($("#success-message"));
            setMessage($("#error-message"), normalizeMessage(text, "error"));
        }

        function clearSendingOtpTimeout() {
            if (sendingOtpTimeout) {
                clearTimeout(sendingOtpTimeout);
                sendingOtpTimeout = null;
            }
        }

        function startSendingOtpIndicator() {
            clearSendingOtpTimeout();
            // Show only if request isn't instant (prevents flicker)
            sendingOtpTimeout = setTimeout(function() {
                showSuccess("Sending OTP...");
                sendingOtpTimeout = null;
            }, 250);
        }
        
        // Don't clear messages here; replace only when new message differs

        // Check if any error message is visible
        if ($("#error-message").is(":visible") || $("#error1-message").is(":visible")) {
            // If any error message is visible, alert the user and stop the form submission
            alert("Please correct the errors before submitting the form.");
            $(this).prop('disabled', false); // Enable the button again
            return;
        }
    
        var stage = $("#submit-btn").data('stage');

        if (stage === 'otp_verified') {
            // Final step: create account
            $("#submit-btn").prop('disabled', true);
            $.ajax({
                url: "python/signup.py",
                type: "POST",
                data: { create_account: 1 },
                beforeSend: function() {
                    $("#success-message").text("Creating account...").show();
                    $("#error-message").text('').hide();
                },
                success: function(response) {
                    var respFinal = (response || "").trim();
                    if (respFinal === "UserID has been sent to your email") {
                        $("#success-message").text(response).show();
                        setTimeout(function() {
                            window.location.href = "login.html";
                        }, 3000);
                        $(".contact-form")[0].reset();
                    } else {
                        $("#error-message").text(response).show();
                        $("#submit-btn").prop('disabled', false);
                    }
                },
                error: function() {
                    $("#error-message").text("Error: Create account request failed.").show();
                    $("#submit-btn").prop('disabled', false);
                }
            });
            return;
        }

        // First step: send OTP (collect stage only)
        if (stage === 'collect' && $("#name").val() && $("#email").val() && $("#pwd1").val() && $("#pwd2").val() && ($("#agree").is(":checked"))) {
            $.ajax({
                url: "python/signup.py",
                type: "POST",
                data: $(".contact-form").serialize(),
                beforeSend: function() {
                    startSendingOtpIndicator();
                    $("#error1-message").text('').hide();
                },
                success: function(response) {
                    clearSendingOtpTimeout();
                    var resp = (response || "").trim();
                    if (resp === "OTP has been sent to your email") {
                        showSuccess(response);
                        $(".otpverify").show();
                        $("#submit-btn").data('stage', 'otp_sent');

                        // Resend-row not used in single-button mode
                        $("#resend-row").hide();
                        setVerifyMode();
    
                        $("#otp").on("input", function() {
                            $("#error-message").text('').hide();
                        });
                        
                        // Disable the Create button until OTP is verified
                        $("#submit-btn").prop("disabled", true);
                        startSignupOtpTimer();

                        $("#verify-btn").off("click").on("click", function(e) {
                            e.preventDefault();
                            $("#resend-row").hide();

                            if (otpExpired) {
                                $("#otp").val('');
                                $("#verify-btn").prop("disabled", true);
                                $("#submit-btn").prop("disabled", true);

                                // Back to OTP sent stage
                                $("#submit-btn").data('stage', 'otp_sent');

                                $.ajax({
                                    url: "python/signup.py",
                                    type: "POST",
                                    data: { resend_signup_otp: 1 },
                                    beforeSend: function() {
                                        startSendingOtpIndicator();
                                    },
                                    success: function(response) {
                                        clearSendingOtpTimeout();
                                        var resp3 = (response || "").trim();
                                        if (resp3 === "OTP has been sent to your email") {
                                            showSuccess(response);
                                            setVerifyMode();
                                            startSignupOtpTimer();
                                        } else {
                                            showError(response);
                                            setResendMode();
                                            $("#verify-btn").prop("disabled", false);
                                        }
                                    },
                                    error: function() {
                                        clearSendingOtpTimeout();
                                        showError("Error: Remit request failed.");
                                        setResendMode();
                                        $("#verify-btn").prop("disabled", false);
                                    }
                                });
                                return;
                            }
                        
                            if ($("#otp").val()) {
                                $.ajax({
                                    url: "python/signup.py", // replace with the URL of your verification script
                                    type: "POST",
                                    data: { otp: $("#otp").val()},
                                    success: function(response) {
                                        var resp2 = (response || "").trim();
                                        if (resp2 === "OTP verified") {
                                            showSuccess("OTP verified successfully.");
                                            $("#submit-btn").data('stage', 'otp_verified');
                                            clearSignupOtpTimer();
                                            $("#timer").text('');

                                            // OTP step done
                                            $("#verify-btn").prop("disabled", true);
                                            $("#resend-row").hide();

                                            // Enable Create your account button only after verification
                                            $("#submit-btn").prop('disabled', false);
                                        } else {
                                            showError(response);
                                            $("#otp").val('');
                                        }
                                    }
                                });
                            } else {
                                showError("Error: Please enter the OTP.");
                            }
                        });
                    } else {
                        showError(response);
                        $(".contact-form")[0].reset();

                        $("#resend-row").hide();

                        // Reset flow
                        $("#submit-btn").data('stage', 'collect');

                        // Allow retry after backend validation/mailer errors
                        $("#submit-btn").prop('disabled', false);
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    clearSendingOtpTimeout();
                    var status = (xhr && xhr.status) ? ("HTTP " + xhr.status) : "";
                    var serverText = (xhr && xhr.responseText) ? String(xhr.responseText).trim() : "";
                    var details = serverText ? (" - " + serverText.substring(0, 250)) : "";
                    console.error('Signup AJAX failed:', { status: status, textStatus: textStatus, errorThrown: errorThrown, responseText: serverText });
                    showError("Error: Signup request failed. " + status + details);
                    $("#submit-btn").prop('disabled', false);
                }
            });
        }else {
            showError("Error: All fields are required. Ensure you check the terms & conditions.");
            $(this).prop('disabled', false);
        }
    });
});

window.onpageshow = function(event) {
    if (event.persisted) {
        // Reset the form
        $(".contact-form")[0].reset();
    }
};


