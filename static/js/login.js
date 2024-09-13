// to show password or hide it
const togglePassword = document.querySelector("#togglePassword");
const password = document.querySelector("#password");

togglePassword.addEventListener("click", function () {
  // Toggle password visibility
  const type =
    password.getAttribute("type") === "password" ? "text" : "password";
  password.setAttribute("type", type);

  // Toggle the icon
  this.querySelector("i").classList.toggle("bi-eye");
  this.querySelector("i").classList.toggle("bi-eye-slash");
});

function sanitizeInput(userInput) {
  // Remove all HTML tags from user input
  let sanitizedInput = userInput.replace(/(<([^>]+)>)/gi, "");
  return sanitizedInput;
}

// Custom Validation and Form Submission
(function () {
  "use strict";

  const form = document.getElementById("loginForm");

  form.addEventListener(
    "submit",
    function (event) {
      // Prevent form submission for validation and AJAX handling
      event.preventDefault();

      var passwordInput = document.getElementById("password");
      var emailInput = document.getElementById("email");

      // Check if password length is at least 8 characters
      if (passwordInput.value.length < 8) {
        passwordInput.setCustomValidity(
          "Password must be at least 8 characters long."
        );
      } else {
        passwordInput.setCustomValidity("");
      }

      var emailDomain = emailInput.value.split("@")[1];
      if (emailDomain !== "gmail.com") {
        emailInput.setCustomValidity("Email domain must be gmail.com.");
      } else {
        emailInput.setCustomValidity("");
      }

      // If the form is not valid, prevent submission
      if (!form.checkValidity()) {
        event.stopPropagation();
      } else {
        const formData = new FormData(form);

        // Convert form data to JSON
        const data = {
          email: sanitizeInput(formData.get("email")),
          password: sanitizeInput(formData.get("password")),
        };

        $.ajax({
          url: `${location.protocol}//${location.host}/auth/signin/`,
          type: "POST",
          headers: {
            "X-CSRFToken": formData.get("csrfmiddlewaretoken"),
          },
          contentType: "application/json",
          data: JSON.stringify(data),
          success: function (data) {
            console.log(data);

            if (data.message == "Email or password is invalid") {
              document.querySelector("#messages").textContent = data.message;
            } else {
              if (data.redirect_url) {
                window.location.href = data.redirect_url;
              } else {
                window.location.href = "/";
              }
            }
          },
          error: function (error) {
            console.error("Login failed:", error);
            let message = error.response?.data?.message || "Login failed.";

            if (error.responseJSON.message) {
              message =
                error.responseJSON.message +
                ` in ${error.responseJSON.available_in}`;
            }

            document.getElementById("error-message").textContent = message;
          },
        });
      }

      form.classList.add("was-validated");
    },
    false
  );
})();
