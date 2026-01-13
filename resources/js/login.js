

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
  const password1 = $("#pwd");
  const username = $("#username"); // Assuming the id of the username field is 'username'
  const submitBtn = $("#submit-btn");

  // Enable the button initially
  submitBtn.prop("disabled", false);

  // Add event listeners to both input fields
  password1.on("input", checkInputs);
  username.on("input", checkInputs);

  function checkInputs() {
      // Check if both fields are not empty
      if ((password1.val() !== "" && username.val() !== "") || (password1.val() === "" && username.val() === ""))  {
          // If they are not empty, enable the button
          submitBtn.prop("disabled", false);
      } else {
          // If any of them is empty, disable the button
          submitBtn.prop("disabled", true);
      }
  }

});

$("#username, #pwd, #otp").on("input", function() {
  $("#error-message").text('').hide();
  $("#error1-message").text('').hide();
});

$("#username").on("focusout",function() {
    var username = $(this).val();

    if (username) { // Only make the AJAX request if the username is not empty
        $.ajax({
            url: "resources/php/login.php", // replace with the URL of your script that checks if a username is available
            type: "POST",
            data: { username: username },
            success: function(response) {
                if (response === "Account Not Found! Please create your account.") {
                    $("#error1-message").text(response).show();
                    $("#submit-btn").prop('disabled', true);
                } else {
                    $("#error1-message").text('').hide();
                    $("#submit-btn").prop('disabled', false);
                }
            }
        });
    } else {
        $("#error1-message").text('').hide();
        $("#submit-btn").prop('disabled', false);
    }
});





$("#submit-btn").click(function(e) {
  e.preventDefault();

  var timerInterval = null;
  var otpExpired = false;
    var sendingOtpTimeout = null;

  function setMessage($el, text) {
      var next = String(text || "");
      if ($el.is(":visible") && $el.text() === next) {
          return;
      }
      $el.text(next).show();
  }

  function hideMessage($el) {
      if ($el.is(":visible")) {
          $el.text("").hide();
      }
  }

  function showSuccess(text) {
      hideMessage($("#error-message"));
      setMessage($("#success-message"), text);
  }

  function showError(text) {
      hideMessage($("#success-message"));
      setMessage($("#error-message"), text);
  }

  function setVerifyMode() {
      otpExpired = false;
      $("#verify-btn").val("Verify");
  }

  function setResendMode() {
      otpExpired = true;
      $("#verify-btn").val("Remit");
  }

  function clearLoginOtpTimer() {
      if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
      }
  }

  function sendLoginOtp(isResend) {
      $("#error1-message").text('').hide();
      $("#resend-row").hide();
      $("#otp").val('');

      if (sendingOtpTimeout) {
          clearTimeout(sendingOtpTimeout);
          sendingOtpTimeout = null;
      }

      $("#submit-btn").prop("disabled", true);
      $("#verify-btn").prop("disabled", true);

      // Show "Sending OTP..." only if the request isn't instant (prevents flicker on fast failures)
      sendingOtpTimeout = setTimeout(function() {
          showSuccess("Sending OTP...");
          sendingOtpTimeout = null;
      }, 250);

      $.ajax({
          url: "resources/php/login.php",
          type: "POST",
          data: isResend ? { resend_login_otp: 1 } : $(".contact-form").serialize(),
          success: function(response) {
              if (sendingOtpTimeout) {
                  clearTimeout(sendingOtpTimeout);
                  sendingOtpTimeout = null;
              }
              var resp = (response || "").trim();
              if (resp === "OTP has been sent to your email") {
                  showSuccess(response);
                  $(".otpverify").show();
                  $("#resend-row").hide();

                  setVerifyMode();
                  startLoginOtpTimer();
                  $("#verify-btn").prop("disabled", false);
              } else {
                  showError(response);
                  $("#submit-btn").prop("disabled", false);
                  $("#verify-btn").prop("disabled", false);
              }
          },
          error: function() {
              if (sendingOtpTimeout) {
                  clearTimeout(sendingOtpTimeout);
                  sendingOtpTimeout = null;
              }
              showError(isResend ? "Error: Remit request failed." : "Error: OTP request failed.");
              $("#submit-btn").prop("disabled", false);
              $("#verify-btn").prop("disabled", false);
          }
      });
  }

  function startLoginOtpTimer() {
      var timeLeft = 120; // 2 minutes in seconds
      var timerElement = $("#timer");

      clearLoginOtpTimer();

      timerElement.text("Time left: 2:00");
      $("#resend-row").hide();
      setVerifyMode();

      timerInterval = setInterval(function() {
          timeLeft--;
          var minutes = Math.floor(timeLeft / 60);
          var seconds = timeLeft % 60;

          if (seconds < 10) {
              seconds = "0" + seconds;
          }

          timerElement.text("Time left: " + minutes + ":" + seconds);

          if (timeLeft <= 0) {
              clearLoginOtpTimer();
              timerElement.text("Time's up!");

              // Switch Verify -> Resend (same button)
              setResendMode();
              $("#verify-btn").prop("disabled", false);
          }
      }, 1000);
  }

  // Disable the button
  $(this).prop('disabled', true);

  if ($("#username").val() && $("#pwd").val()){
    sendLoginOtp(false);

    $("#otp").off("input").on("input", function() {
        $("#error-message").text('').hide();
    });

    $("#verify-btn").off("click").on("click", function(e) {
        e.preventDefault();
        $("#resend-row").hide();

        if (otpExpired) {
            sendLoginOtp(true);
            return;
        }

        if (!$("#otp").val()) {
            showError("Error: Please enter the OTP.");
            return;
        }

        $.ajax({
            url: "resources/php/login.php",
            type: "POST",
            data: { otp: $("#otp").val() },
            success: function(response) {
                var resp2 = (response || "").trim();
                if (resp2 === "OTP is valid.") {
                    showSuccess(response);
                    $(".contact-form")[0].reset();
                    clearLoginOtpTimer();
                    $("#timer").text('');
                    window.location.href = "index2s.html";
                } else {
                    showError(response);
                    $("#otp").val('');
                }
            },
            error: function() {
                showError("Error: OTP verification failed.");
            }
        });
    });
  }else {
      showError("Error: All fields are required.");
      $(this).prop('disabled', false);
  }
});

window.onpageshow = function(event) {
    if (event.persisted) {
        // Reset the form
        $(".contact-form")[0].reset();
    }
};