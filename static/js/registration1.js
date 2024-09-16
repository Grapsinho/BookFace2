// Toggle Password Visibility
const togglePassword = document.querySelector("#togglePassword");
const password = document.querySelector("#password");

togglePassword.addEventListener("click", function () {
  const type =
    password.getAttribute("type") === "password" ? "text" : "password";
  password.setAttribute("type", type);
  this.querySelector("i").classList.toggle("bi-eye");
  this.querySelector("i").classList.toggle("bi-eye-slash");
});

// Populate day options
const birthDaySelect = document.getElementById("birthDay");
for (let day = 1; day <= 31; day++) {
  const option = document.createElement("option");
  option.value = day;
  option.textContent = day;
  birthDaySelect.appendChild(option);
}

// Populate year options
const birthYearSelect = document.getElementById("birthYear");
const currentYear = new Date().getFullYear();
for (let year = currentYear; year >= 1920; year--) {
  const option = document.createElement("option");
  option.value = year;
  option.textContent = year;

  birthYearSelect.appendChild(option);
}

// Function to Sanitize Input
function sanitizeInput(userInput) {
  // Remove all HTML tags from user input
  return userInput.replace(/(<([^>]+)>)/gi, "");
}

// Custom Validation and Form Submission
(function () {
  "use strict";

  const form = document.getElementById("registrationForm");

  form.addEventListener(
    "submit",
    function (event) {
      // Prevent form submission for validation and AJAX handling
      event.preventDefault();

      const passwordInput = document.getElementById("password");
      const confirmPasswordInput = document.getElementById("confirmPassword");
      const emailInput = document.getElementById("email");

      // Check if password length is at least 8 characters
      if (passwordInput.value.length < 8) {
        passwordInput.setCustomValidity(
          "Password must be at least 8 characters long."
        );
      } else {
        passwordInput.setCustomValidity("");
      }

      // Check if passwords match
      if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity("Passwords do not match.");
      } else {
        confirmPasswordInput.setCustomValidity("");
      }

      // Check if email domain is 'gmail.com'
      const emailDomain = emailInput.value.split("@")[1];
      if (emailDomain !== "gmail.com") {
        emailInput.setCustomValidity("Email domain must be gmail.com.");
      } else {
        emailInput.setCustomValidity("");
      }

      // If the form is not valid, prevent submission
      if (!form.checkValidity()) {
        event.stopPropagation();
      } else {
        // If the form is valid, prepare AJAX submission
        const formData = new FormData(form);

        // Convert form data to JSON and sanitize inputs
        const data = {
          first_name: sanitizeInput(formData.get("first_name")),
          last_name: sanitizeInput(formData.get("last_name")),
          gender: sanitizeInput(formData.get("gender")),
          birth_day: sanitizeInput(formData.get("birth_day")),
          birth_month: sanitizeInput(formData.get("birth_month")),
          birth_year: sanitizeInput(formData.get("birth_year")),
          email: sanitizeInput(formData.get("email")),
          password: sanitizeInput(formData.get("password")),
        };

        // Send data via AJAX POST request
        $.ajax({
          url: `${location.protocol}//${location.host}/auth/signup/`,
          type: "POST",
          headers: {
            "X-CSRFToken": formData.get("csrfmiddlewaretoken"),
          },
          contentType: "application/json",
          data: JSON.stringify(data),
          success: function (response) {
            // Redirect to login page upon successful registration
            window.location.href = `${location.protocol}//${location.host}/auth/login/`;
          },
          error: function (error) {
            try {
              const errorResponse = error.responseJSON.non_field_errors;

              errorResponse.forEach((element) => {
                document.getElementById("error-message").style.backgroundColor =
                  "#d01c1cb0";
                document.getElementById("error-message").textContent = element;
              });
            } catch (error) {
              // Handle error (e.g., show error message to user)
              document.getElementById("error-message").textContent =
                "Registration failed. Please try again.";
            }
          },
        });
      }

      form.classList.add("was-validated");
    },
    false
  );
})();
