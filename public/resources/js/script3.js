$("#otp").on("input", function() {
    $("#error-message").text('').hide();
});

$(document).ready(function () {
    var timerInterval = null;
    var otpExpiresAt = null;
    var otpExpired = false;
    var sendingOtpTimeout = null;

    var $subscribeBtn = $('.free-button');
    var $verifyBtn = $('#submit-btn');

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
            'Sending OTP...': 'Sending payment OTP to your email. Please wait...',
            'OTP has been sent to your email': 'Payment OTP sent. Check your inbox or spam and enter it within 2 minutes.',
            'Your Order Successfully Placed': 'Payment verified and order placed successfully. Redirecting shortly...',
            'Invalid OTP!': 'That OTP does not match. Please recheck and try again.',
            'OTP expired!': 'OTP expired. Click Remit OTP to receive a fresh OTP.',
            'Error: Please enter the OTP.': 'Please enter the payment OTP to continue.',
            'Error: Payment request failed.': 'Could not initiate payment verification right now. Please try again.',
            'Error while verifying OTP. Please try again.': 'Could not verify payment OTP right now. Please try again.',
            'Error: Remit request failed.': 'Could not send a fresh payment OTP right now. Please try Remit OTP again.'
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
        $verifyBtn.val('Verify OTP').prop('disabled', false);
    }

    function setResendMode() {
        otpExpired = true;
        $verifyBtn.val('Remit OTP').prop('disabled', false);
    }

    function startOtpTimer() {
        clearOtpTimer();
        otpExpiresAt = Date.now() + 120000;
        setVerifyMode();
        renderOtpTimer();
        timerInterval = setInterval(renderOtpTimer, 1000);
    }

    $.getJSON('python/index3.py')
        .done(function (data) {
            if (!data || data.error) {
                return;
            }

            $('#summary-price').text(Number(data.price ?? 0).toFixed(0));
            $('#summary-days').text(data.daysLabel ?? '-');
            $('#summary-sgst').text(Number(data.sgst ?? 0).toFixed(2));
            $('#summary-cgst').text(Number(data.cgst ?? 0).toFixed(2));
            $('#summary-discount').text(Number(data.discount ?? 0).toFixed(2));
            $('#summary-total').text(Number(data.totalAmount ?? 0).toFixed(2));
        })
        .fail(function () {
            // If session is missing, keep defaults.
        });
    $subscribeBtn.on('click', function(e) {
        e.preventDefault();

        $subscribeBtn.prop('disabled', true);

        var paymentOption;
        var paymentData;

        $('.btn-light:visible').each(function() {
            if ($(this).hasClass('collapsed')) {
                return true;
            }
            paymentOption = $(this).data('payment');
            return false;
        });

        if (!paymentOption) {
            alert('Please select a payment option.');
            $subscribeBtn.prop('disabled', false);
            return;
        }

        switch (paymentOption) {
            case 'upi':
                paymentData = $('#upi').val();
                if (!paymentData) {
                    alert('Please enter your UPI ID.');
                    $subscribeBtn.prop('disabled', false);
                    return;
                }
                break;
            case 'ccn':
                paymentData = $('#ccn').val();
                var pd1 = $('#ccn1').val();
                var pd2 = $('#ccn2').val();
                if (!paymentData || !pd1 || !pd2) {
                    alert('Please fill card details.');
                    $subscribeBtn.prop('disabled', false);
                    return;
                }
                break;
            case 'paypal':
                paymentData = $('#paypal').val();
                if (!paymentData) {
                    alert('Please enter your paypal ID.');
                    $subscribeBtn.prop('disabled', false);
                    return;
                }
                break;
            default:
                alert('Invalid payment option.');
                $subscribeBtn.prop('disabled', false);
                return;
        }

        var fullName = $('#fn').val();
        var phoneNumber = $('#ph').val();
        var streetAddress = $('#sa').val();
        var city = $('#ct').val();
        var state = $('#st').val();
        var pinCode = $('#pin').val();

        if (!fullName || !phoneNumber || !streetAddress || !city || !state || !pinCode) {
            alert('Please fill in all fields.');
            $subscribeBtn.prop('disabled', false);
            return;
        }

        $.ajax({
            url: 'python/billing.py',
            type: 'post',
            data: {
                paymentData: paymentData,
                fullName: fullName,
                phoneNumber: phoneNumber,
                streetAddress: streetAddress,
                city: city,
                state: state,
                pinCode: pinCode
            },
            beforeSend: function() {
                startSendingOtpIndicator();
            },
            success: function(response) {
                clearSendingOtpTimeout();
                var resp = (response || '').trim();
                if (resp === 'OTP has been sent to your email') {
                    showSuccess(response);
                    $('#otp-card').show();
                    $subscribeBtn.prop('disabled', true);
                    startOtpTimer();
                    return;
                }

                showError(response);
                $subscribeBtn.prop('disabled', false);
            },
            error: function() {
                clearSendingOtpTimeout();
                showError('Error: Payment request failed.');
                $subscribeBtn.prop('disabled', false);
            }
        });
    });

    $verifyBtn.off('click').on('click', function(e) {
        e.preventDefault();

        if (otpExpired) {
            $verifyBtn.prop('disabled', true);
            $('#otp').val('');

            $.ajax({
                url: 'python/billing.py',
                type: 'post',
                data: { resend_payment_otp: 1 },
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

        var otp = ($('#otp').val() || '').trim();
        if (!otp) {
            showError('Error: Please enter the OTP.');
            return;
        }

        $verifyBtn.prop('disabled', true);
        $.ajax({
            url: 'python/billing.py',
            type: 'post',
            data: { otp: otp },
            success: function(response) {
                var resp = (response || '').trim();
                if (resp === 'Your Order Successfully Placed') {
                    showSuccess(response);
                    clearOtpTimer();
                    $('#timer').text('');
                    setTimeout(function() {
                        window.location.href = 'index2s.html';
                    }, 5000);
                    $('.contact-form')[0].reset();
                } else {
                    showError(response);
                    if (resp === 'OTP expired!') {
                        setResendMode();
                    } else {
                        $verifyBtn.prop('disabled', false);
                    }
                }
            },
            error: function() {
                showError('Error while verifying OTP. Please try again.');
                $verifyBtn.prop('disabled', false);
            }
        });
    });
});


