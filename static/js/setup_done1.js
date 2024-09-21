import {
  sendRequestInUtility,
  refreshTokenAndRetryInUtility,
} from "./utility.js";
let counter = 0;
document.addEventListener("DOMContentLoaded", () => {
  const interestItems = document.querySelectorAll(".interest-item");

  interestItems.forEach((item, idx) => {
    item.addEventListener("click", () => {
      if (counter >= 5 && !item.classList.contains("selected")) {
        interestItems.forEach((element2) => {
          if (!element2.classList.contains("selected")) {
            element2.setAttribute("disabled", "");
          }
        });
      } else {
        if (item.classList.contains("selected")) {
          item.classList.remove("selected");
          counter -= 1;

          interestItems.forEach((element2) => {
            console.log(!element2.classList.contains("selected"));
            if (!element2.classList.contains("selected")) {
              element2.removeAttribute("disabled");
            }
          });
        } else {
          item.classList.add("selected");
          counter++;
        }
      }

      if (counter >= 1) {
        document.querySelector("#done-setup").removeAttribute("disabled");
      } else {
        document.querySelector("#done-setup").setAttribute("disabled", "");
      }
    });
  });

  document.getElementById("next-step").addEventListener("click", function () {
    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
  });

  document.getElementById("back-step").addEventListener("click", function () {
    document.getElementById("step2").style.display = "none";
    document.getElementById("step1").style.display = "block";
  });

  const done_button = document.getElementById("done-setup");
  const interests_tag = [];

  function sendRequestToSaveTags(data) {
    sendRequestInUtility(
      "/profile/setup/done/",
      "POST",
      data,
      function (response) {
        console.log(response);

        if (response.message == "Tags Added") {
          window.location.href = "/";
        }
      },
      function (xhr) {
        if (
          xhr.responseJSON?.detail ===
          "Authentication credentials were not provided or are invalid."
        ) {
          // ვარეფრეშებთ ტოკენს
          refreshTokenAndRetryInUtility(() => sendRequestToSaveTags(data)); // Retry after refreshing token
        }
      }
    );
  }

  done_button.addEventListener("click", () => {
    const selectedItems = document.querySelectorAll(".interest-item.selected");

    selectedItems.forEach((element) => {
      interests_tag.push(element.dataset.interest);
    });

    sendRequestToSaveTags(interests_tag);
  });
});
