function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      // Check if this cookie string begins with the name provided
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
var csrftoken = getCookie("csrftoken");

const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

// code to sum all notifications messages and other notifications
const message_count_chat_divs = document.querySelectorAll(
  ".received_message_messageTab"
);
let message_count = message_count_chat_divs.length;

const message_count_chat = (document.querySelector(
  ".message_count_chat"
).textContent = message_count);

const notification_count = document.querySelector(".notification_count");

let sum_notification_count =
  parseInt(notification_count.textContent) + parseInt(message_count);

notification_count.textContent = sum_notification_count;

const notification_count_mobile = document.querySelector(
  ".notification_count_mobile"
);

if (notification_count_mobile)
  notification_count_mobile.textContent = sum_notification_count;
