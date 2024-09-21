const addFriendBtn = document.querySelector(".add_friend_btn_profile");
const delete_from_friends = document.querySelector(".delete_from_friends");
const add_friend_btn_setup = document.querySelectorAll(".add-friend-btn-setup");

// General function to send requests using fetch
export function sendRequest(url, method, data, successCallback, errorCallback) {
  fetch(`${location.protocol}//${location.host}${url}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken, // CSRF token is passed here
    },
    body: method === "GET" ? null : JSON.stringify(data),
    credentials: "include", // Ensures credentials (cookies) are sent with the request
  })
    .then((response) => response.json())
    .then((data2) => {
      if (data2.detail === "Friend request already sent.") {
        alert("Friend request already sent.");
      }

      if (data2.detail === "No pending friend request found.") {
        alert("No pending friend request found.");
      }

      if (data2.detail === "You are already friends with this user.") {
        alert("You are already friends with this user.");
      }

      if (
        data2.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        refreshTokenAndRetry(() =>
          sendRequest(url, method, data, successCallback, errorCallback)
        ); // Retry if token issue
      } else {
        successCallback(data2); // Call success callback on success
      }
    })
    .catch((error) => {
      errorCallback(error); // Call error callback in case of failure
    });
}

// Function to send a friend request
function sendFriendRequest(receiverId, button) {
  const data = { receiver_id: receiverId };

  sendRequest(
    "/friendship/sendFriendRequest/", // Your API endpoint for sending a friend request
    "POST", // HTTP method
    data, // Data to be sent (receiver's ID)
    function (response) {
      // Success callback
      button.textContent = "Request Sent";
      button.style.pointerEvents = "none";
    },
    function (error) {
      // Error callback
      console.error("Failed to send friend request", error);
      alert(
        error.detail || "An error occurred while sending the friend request."
      );
    }
  );
}

// Function to send a friend request
export function sendRejectRequest(senderId, button, notificationId) {
  const data = {
    sender_id: senderId,
    notification_id: notificationId,
  };

  sendRequest(
    "/friendship/RejectFriendRequestView/", // Your API endpoint for sending a friend request
    "POST", // HTTP method
    data, // Data to be sent (sender's ID)
    function (response) {
      button.textContent = "Rejected";
      button.style.backgroundColor = "#8d8d8d";
      button.style.pointerEvents = "none";

      const acceptClosestButton =
        button.parentElement.querySelector(".add_friend_appr");

      acceptClosestButton.style.pointerEvents = "none";
    },
    function (error) {
      // Error callback
      console.error("Failed to send friend request", error);
      alert(
        error.detail || "An error occurred while sending the friend request."
      );
    }
  );
}

// Function to send a friend request
export function sendAcceptRequest(senderId, button, notificationId) {
  const data = {
    sender_id: senderId,
    notification_id: notificationId,
  };

  sendRequest(
    "/friendship/AcceptFriendRequestView/", // Your API endpoint for sending a friend request
    "POST", // HTTP method
    data, // Data to be sent (sender's ID)
    function (response) {
      button.textContent = "Accepted";
      button.style.backgroundColor = "#8d8d8d";
      button.style.pointerEvents = "none";

      const declineClosestButton = button.parentElement.querySelector(
        ".decline_friend_request"
      );

      declineClosestButton.style.pointerEvents = "none";
    },
    function (error) {
      // Error callback
      console.error("Failed to send friend request", error);
      alert(
        error.detail || "An error occurred while sending the friend request."
      );
    }
  );
}

// Function to remove a friend
function removeFriend(remove_friend_id, button) {
  const data = {
    unfriend_friend_id: remove_friend_id,
  };

  sendRequest(
    "/friendship/RemoveFriendRequestView/", // Your API endpoint for sending a friend request
    "POST", // HTTP method
    data, // Data to be sent (sender's ID)
    function (response) {
      button.textContent = "Removed";
      button.style.backgroundColor = "#8d8d8d";
      button.style.pointerEvents = "none";
    },
    function (error) {
      // Error callback
      console.error("Failed to send friend request", error);
      alert(
        error.detail || "An error occurred while sending the friend request."
      );
    }
  );
}

// Example usage: Adding click event listener for the "Add Friend" button
document.addEventListener("DOMContentLoaded", function () {
  if (add_friend_btn_setup) {
    add_friend_btn_setup.forEach((element) => {
      element.addEventListener("click", () => {
        const receiverId = element.getAttribute("data-receiver_id");
        sendFriendRequest(receiverId, element);
      });
    });
  }

  if (addFriendBtn) {
    addFriendBtn.addEventListener("click", function () {
      const receiverId = this.getAttribute("data-receiver_id");
      sendFriendRequest(receiverId, addFriendBtn);
    });
  }

  if (delete_from_friends) {
    delete_from_friends.addEventListener("click", function () {
      const unfriend_user_id = this.getAttribute("data-unfriend_user_id");
      removeFriend(unfriend_user_id, delete_from_friends);
    });
  }
});

// Token refresh function (if needed)
function refreshTokenAndRetry(retryCallback) {
  sendRequest(
    "/auth/token/refresh/",
    "POST",
    {}, // No additional data needed for token refresh
    function (data) {
      console.log("Token refreshed successfully", data);

      if (data.message === "logout qeni") {
        window.location.href = `${location.protocol}//${location.host}/auth/logout/`; // Redirect to logout if needed
      }
      retryCallback(); // Retry the original request after the token is refreshed
    },
    function (error) {
      console.error("Token refresh failed", error);
      if (error.message === "logout qeni") {
        window.location.href = `${location.protocol}//${location.host}/auth/logout/`; // Redirect to logout if needed
      }
    }
  );
}
