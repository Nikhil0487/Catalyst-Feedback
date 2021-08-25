$(document).ready(function() {
    $("#basic-form").validate({
        errorClass: "error fail-alert",
        validClass: "valid success-alert",
        rules: {
            name: {
                required: true,
                minlength: 3
            },
            feature: {
                required: true,
                minlength: 5
            },
            email: {
                required: true,
                email: true
            },
            idea: {
                required: true,
                minlength: 10
            },
            description: {
                required: true,
                minlength: 10
            },
        },
        messages: {
            name: {
                minlength: "Name should be at least 3 characters"
            },
            feature: {
                minlength: "Please enter the name of the feature"
            },
            email: {
                email: "The email should be in the format: abc@domain.tld"
            },
            idea: {
                minlength: "The idea should be atleast 10 characters"
            },
            description: {
                minlength: "The idea should be atleast 10 characters"
            }
        },
        //Submit Handler Function
        submitHandler: function(form) {
            // add a loading image in place of your returning outcome
            $("#simple-msg").html("Sending...");
            console.log("on click")
            var nameVal = $("#name").val();
            var emailVal = $("#email").val();
            var feature = $("#features").val();
            var idea = $("#idea").val();
            var desc = $("#description").val();
            var feedback = {
                Name: nameVal,
                Email: emailVal,
                Feature: feature,
                Idea: idea,
                Description: desc
            };
            $.ajax({
                type: 'POST',
                contentType: "application/json; charset=utf-8",
                url: '/server/catalyst_feedback_function/support/feedback', //Ensure that 'to_do_list_function' is the package name of your function
                data: JSON.stringify(feedback),
                success: function(data) {
                    location.reload(); //Reloads the page on success
                }
            });
            return false;
        }
    });
});