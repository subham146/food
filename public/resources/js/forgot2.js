$(document).ready(function() {
    var timerInterval = null;
    var otpExpiresAt = null;
    var otpExpired = false;
    var sendingOtpTimeout = null;

    var email = $('#email');
    var emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    var submitBtn = $('#submit-btn');
    var verifyBtn = $('#verify-btn');

    function setMessage($el, text) {
        var next = String(text || '');
        if ($el.is(':visible') && $el.text() === next) {
            return;
        }
        $el.text(next).show();
    }

    function normalizeMessage(text, type) {
        var raw = String(text || '').trim();
        if (!raw) {
            return type === 'error' ? 'Something went wrong. Please try again.' : '';
        }

        var map = {
            'Sending OTP...': 'Sending password reset OTP to your admin email. Please wait...',
            'OTP has been sent to your email': 'OTP sent successfully. Check your inbox or spam and enter it within 2 minutes.',
            'OTP is valid.': 'OTP verified. Taking you to reset password...',
            'Invalid OTP!': 'That OTP does not match. Please recheck and try again.',
            'OTP expired!': 'OTP expired. Click Remit to receive a fresh OTP.',
            'Account not Found!': 'No admin account found for that email address.',
            'Error: Please enter the OTP.': 'Please enter the OTP to continue.',
            'Error: All fields are required.': 'Please enter your email to continue.',
            'Error: OTP request failed.': 'Could not send OTP right now. Please try again in a moment.',
            'Error while verifying OTP. Please try again.': 'Could not verify OTP right now. Please try again.',
            'Error: Remit request failed.': 'Could not send a fresh OTP right now. Please try Remit again.'
        };

        return map[raw] || raw;
    }

    function hideMessage($el) {
        if ($el.is(':visible')) {
            $el.text('').hide();
        }
    }

    function showSuccess(text) {
        hideMessage($('#error-message'));
        setMessage($('#success-message'), normalizeMessage(text, 'success'));
    }

    function showError(text) {
        hideMessage($('#success-message'));
        setMessage($('#error-message'), normalizeMessage(text, 'error'));
    }

    function clearSendingOtpTimeout() {
        if (sendingOtpTimeout) {
            clearTimeout(sendingOtpTimeout);
            sendingOtpTimeout = null;
        }
    }

    function startSendingOtpIndicator() {
        clearSendingOtpTimeout();
        sendingOtpTimeout = setTimeout(function() {
            showSuccess('Sending OTP...');
            sendingOtpTimeout = null;
        }, 250);
    }

    function clearOtpTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        otpExpiresAt = null;
    }

    function renderOtpTimer() {
        var timerElement = $('#timer');
        if (!otpExpiresAt) {
            timerElement.text('');
            return;
        }

        var remainingMs = otpExpiresAt - Date.now();
        if (remainingMs <= 0) {
            clearOtpTimer();
            timerElement.text("Time's up!");
            setResendMode();
            return;
        }

        var totalSeconds = Math.ceil(remainingMs / 1000);
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        if (seconds < 10) {
            seconds = '0' + seconds;
        }

        timerElement.text('Time left: ' + minutes + ':' + seconds);
    }

    function setVerifyMode() {
        otpExpired = false;
        verifyBtn.val('Verify').prop('disabled', false);
    }

    function setResendMode() {
        otpExpired = true;
        verifyBtn.val('Remit').prop('disabled', false);
    }

    function startOtpTimer() {
        clearOtpTimer();
        otpExpiresAt = Date.now() + 120000;
        setVerifyMode();
        renderOtpTimer();
        timerInterval = setInterval(renderOtpTimer, 1000);
    }

    function checkEmail() {
        submitBtn.prop('disabled', !emailRegex.test(email.val()));
    }

    submitBtn.prop('disabled', false);
    email.on('input', checkEmail);

    $('#email, #otp').on('input', function() {
        $('#error-message').text('').hide();
    });

    submitBtn.on('click', function(e) {
        e.preventDefault();

        if (!$('#email').val()) {
            showError('Error: All fields are required.');
            submitBtn.prop('disabled', false);
            return;
        }

        submitBtn.prop('disabled', true);

        $.ajax({
            url: 'python/forgot2.py',
            type: 'POST',
            data: $('.contact-form').serialize(),
            beforeSend: function() {
                startSendingOtpIndicator();
            },
            success: function(response) {
                clearSendingOtpTimeout();
                var resp = (response || '').trim();
                if (resp === 'OTP has been sent to your email') {
                    showSuccess(response);
                    $('.otpverify').show();
                    submitBtn.prop('disabled', true);
                    startOtpTimer();
                    return;
                }

                showError(response);
                submitBtn.prop('disabled', false);
            },
            error: function() {
                clearSendingOtpTimeout();
                showError('Error: OTP request failed.');
                submitBtn.prop('disabled', false);
            }
        });
    });

    verifyBtn.off('click').on('click', function(e) {
        e.preventDefault();

        if (otpExpired) {
            verifyBtn.prop('disabled', true);
            $('#otp').val('');

            $.ajax({
                url: 'python/forgot2.py',
                type: 'POST',
                data: { resend_admin_forgot_otp: 1 },
                beforeSend: function() {
                    startSendingOtpIndicator();
                },
                success: function(response) {
                    clearSendingOtpTimeout();
                    var resp = (response || '').trim();
                    if (resp === 'OTP has been sent to your email') {
                        showSuccess(response);
                        setVerifyMode();
                        startOtpTimer();
                    } else {
                        showError(response);
                        setResendMode();
                    }
                },
                error: function() {
                    clearSendingOtpTimeout();
                    showError('Error: Remit request failed.');
                    setResendMode();
                }
            });
            return;
        }

        var enteredOtp = ($('#otp').val() || '').trim();
        if (!enteredOtp) {
            showError('Error: Please enter the OTP.');
            return;
        }

        verifyBtn.prop('disabled', true);
        $.ajax({
            url: 'python/forgot2.py',
            type: 'POST',
            data: { otp: enteredOtp },
            success: function(response) {
                var resp = (response || '').trim();
                if (resp === 'OTP is valid.') {
                    showSuccess(response);
                    clearOtpTimer();
                    $('#timer').text('');
                    window.location.href = 'change2.html';
                } else {
                    showError(response);
                    $('#otp').val('');
                    if (resp === 'OTP expired!') {
                        setResendMode();
                    } else {
                        verifyBtn.prop('disabled', false);
                    }
                }
            },
            error: function() {
                showError('Error while verifying OTP. Please try again.');
                verifyBtn.prop('disabled', false);
            }
        });
    });
});

window.onpageshow = function(event) {
    if (event.persisted) {
        $('.contact-form')[0].reset();
    }
};
