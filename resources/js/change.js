window.FOODELIGHT_API_BASE = window.FOODELIGHT_API_BASE || 'https://foodelight.ct.ws/php/';
if (typeof window.jQuery !== 'undefined' && !window.__FOODELIGHT_API_PREFILTER__) {
    window.__FOODELIGHT_API_PREFILTER__ = true;

    $.ajaxSetup({
        xhrFields: { withCredentials: true }
    });

    $.ajaxPrefilter(function(options) {
        if (typeof options.url === 'string' && options.url.indexOf('resources/php/') === 0) {
            options.url = window.FOODELIGHT_API_BASE + options.url.replace(/^resources\/php\//, '');
        }

        options.xhrFields = options.xhrFields || {};
        options.xhrFields.withCredentials = true;
    });
}
// Handler for first input field
$('#icon1').click(function() {
    var password = $('#pwd1');
    password.attr('type', password.attr('type') === 'password' ? 'text' : 'password');
    this.name = this.name == "eye-off-outline" ? "eye-outline" : "eye-off-outline";
});

// Handler for second input field
$('#icon2').click(function() {
    var password = $('#pwd3');
    password.attr('type', password.attr('type') === 'password' ? 'text' : 'password');
    this.name = this.name == "eye-off-outline" ? "eye-outline" : "eye-off-outline";
});

$("#pwd2, #pwd3").on("input", function() {
    if ($(this).val()) {
        $("#error-message").text('').hide();
        $("#error1-message").text('').hide();
    }
});

$(document).ready(function() {
    const password2 = $("#pwd2");
    const password3 = $("#pwd3");
    const submitBtn = $("#submit-btn");
  
    // Enable the button initially
    submitBtn.prop("disabled", false);
  
    // Add event listeners to both password fields
    password2.on("focusout", checkPasswords);
    password3.on("input", checkPasswords);
  
    function checkPasswords() {
        // Password policy: at least one uppercase letter, one lowercase letter, one special character, and one number
        var passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,16}$/;
    
        if (!passwordPolicy.test(password2.val())) {
            $("#pwd3").prop("disabled", true);
            $("#pwd3").val('');
            submitBtn.prop("disabled", true);
            $("#error-message").text('Password should be 8 to 16 characters, with at least one uppercase letter, one lowercase letter, one special character, and one number.').show();
            return;
        }
    
        $("#pwd3").prop("disabled", false);
    
        if (password2.val() === password3.val()) {
            submitBtn.prop("disabled", false);
            $("#error-message").text('').hide();
        } else if (password2.val().length == 0 && password3.val().length == 0) {
            $("#error-message").text('').hide();
            submitBtn.prop("disabled", false);
        } else {
            submitBtn.prop("disabled", true);
            $("#error-message").text('Passwords do not match').show();
        }
    }
});


  $("#submit-btn").click(function(e) {
    e.preventDefault();
    $("#success-message").text('').hide()
    $("#error-message").text('').hide()

    if ($("#pwd2").val() && $("#pwd3").val()) {
        $.ajax({
            url: "resources/php/change.php",
            type: "POST",
            data: $(".contact-form").serialize(),
            success: function(response) {
                if (response === "Password updated successfully") {
                    $("#success-message").text(response).show();
                    $(".contact-form")[0].reset();
                    window.location.href = "login.html"
                } else {
                    $("#error-message").text(response).show();
                    $(".contact-form")[0].reset();
                }
            }
        });
    }else {
        $("#error-message").text("Error: All fields are required.").show();
    }
});