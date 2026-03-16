$("#goal, #gender, #days, #meal, #diet, #sty").on('change', function() {
    $("#error-message").text('').hide();
});

$(document).ready(function () {
    $.getJSON('resources/php/acc.php')
        .done(function (data) {
            var username = (data && data.username) ? data.username : 'Guest';
            $('#profileImage').attr('title', username);
        })
        .fail(function () {
            $('#profileImage').attr('title', 'Guest');
        });
});


$(document).ready(function() {
    // Check the selected goal when the page loads
    var selectedGoal = $('#goal').find('option:selected').val();

    if (selectedGoal === 'wl') {
        $('#keto').show();
    } else {
        $('#keto').hide();
    }



    // Show or hide the "keto" option when the "goal" select box changes
    $('#goal').on('change', function() {
        selectedGoal = $(this).find('option:selected').val();

        if (selectedGoal === 'wl') {
            $('#keto').show();
        } else {
            $('#keto').hide();
        }
    });
});

$(document).ready(function() {
    // Set the initial label text
    var initialOption = $('#meal option:first').text();
    $('#choose').text('Choose your ' + initialOption + ' for each day!');

    var initialLimit = parseInt(initialOption.match(/\d+/)[0]);
    limitCheckboxes(initialLimit);

    // Update the label text when the select box changes
    $('#meal').on('change', function() {
        var selectedOption = $(this).find('option:selected').text();
        $('#choose').text('Choose your ' + selectedOption + ' for each day!');

        // Uncheck all checkboxes and reset them when the selected option changes
        $('.choose input[type=checkbox]').prop('checked', false);

        // Hide the "choose" class if "4 meals" is selected
        if (selectedOption === '4 meals') {
            $('.choose input[type=checkbox]').prop('checked', true);
            $('.choose').hide();
        } else {
            $('.choose').show();
            var newLimit = parseInt(selectedOption.match(/\d+/)[0]);
            limitCheckboxes(newLimit);
        }
    });

    function limitCheckboxes(limit) {
        $('.choose').off('change', 'input[type=checkbox]');
        $('.choose').on('change', 'input[type=checkbox]', function(evt) {
            console.log("Checkbox changed");
            if($('.choose input[type=checkbox]:checked').length > limit) {
                $(this).prop('checked', false);
                alert('You can only select ' + limit + ' meal(s).');
            }
        });
    }
});

$(document).ready(function() {
    // Define the prices for each option
    var prices = {
        diet: {'keto': 215, 'balanced': 168, 'low': 148, 'glu':134 },
        sty: { 
            'keto': { 'veg': 215, 'nonveg': 233, 'egg': 215 },
            'balanced': { 'veg': 168, 'nonveg': 178, 'egg': 168 },
            'low': { 'veg': 148, 'nonveg': 158, 'egg': 148 },
            'glu': { 'veg': 134, 'nonveg': 144, 'egg': 134 }
        }
    };

    // Calculate the initial price


    // Update the price when the selected option in any select box changes
    function calculateAndDisplayPrice() {
        var goal = $("#goal").val();
        var gender = $("#gender").val();
        var days = $("#days").val();
        var meal = $("#meal").val();
        var diet = $("#diet").val();
        var sty = $("#sty").val();

        if (goal && gender && days && meal && diet && sty) {
            var price = calculatePrice(goal, gender, days, meal, diet, sty);
            $("#price").text('₹ ' + price).show();

            $.ajax({
                url: 'resources/php/index2.php', // Replace this with the path to your PHP script
                type: 'POST',
                data: { price: price },
                success: function(data) {
                    console.log('Server response:', data);
                },
                error: function(error) {
                    console.log('Error:', error);
                }
            });
        } else {
            $("#error-message").text("Error: All fields are required.").show();
        }
    }

    // Calculate and display the price when the page loads
    calculateAndDisplayPrice();

    // Calculate and display the price when any select box changes
    $("#goal, #gender, #days, #meal, #diet, #sty").on('change', calculateAndDisplayPrice);



    // Calculate the price based on the selected options
    function calculatePrice() {
        var selectedDays = $('#days').find('option:selected').val();
        if (selectedDays === '2w') {
            selectedDays = 14;
        } else if (selectedDays === "4w"){
            selectedDays = 28;
        } else {
            selectedDays = parseInt(selectedDays);
        }
        var selectedMeal = parseInt($('#meal').find('option:selected').val());
        var selectedDiet = $('#diet').find('option:selected').val();
        var selectedSty = $('#sty').find('option:selected').val();

        if (isNaN(selectedDays) || isNaN(selectedMeal)) {
            return 'Invalid selection';
        }

        return prices.sty[selectedDiet][selectedSty] * selectedDays * selectedMeal;
    }

    $("#submit-btn").click(function(e) {
        e.preventDefault();
        $("#success-message").text('').hide()
        $("#error-message").text('').hide()
    
        var allFieldsFilled = true;
        $(".contact-form input").each(function() {
            if (!$(this).val()) {
                allFieldsFilled = false;
                return false; // Break out of the each loop
            }
        });
      
        if (allFieldsFilled){
          $.ajax({
            url: "resources/php/index2.php",
            type: "POST",
            data: $(".contact-form").serialize(),
            success: function(response) {
                if (response === "Redirecting to payment Page...") {
                    $("#success-message").text(response).show();
                    window.location.href = "index3.html"
                } else {
                    $("#error-message").text(response).show();
                    $(".contact-form")[0].reset();
                    $('.choose input[type=checkbox]').prop('checked', false); // Uncheck all checkboxes
                    $('.choose').show(); // Show the checkboxes
                    var price1 = calculatePrice();
                    $("#price").text('₹ ' + price1); // Set the price back to its default value
                }
            }
          });
        }else {
            $("#error-message").text("Error: All fields are required.").show();
        }
    });
});



window.onpageshow = function(event) {
    if (event.persisted) {
        window.location.reload();
    }
};