import {
  sendAcceptRequest,
  sendRejectRequest,
  sendRequest,
} from "./friends1.js";

import { toggleComment } from "./postActions.js";

const notificationsMenu = document.querySelector(".notifications_modal_body");
const notificationSound_message = new Audio(
  "/static/sounds/new-message-31-183617.mp3"
);
let soundPlayCount = 0;

function sanitizeInput(userInput) {
  // Remove all HTML tags from user input
  let sanitizedInput = userInput.replace(/(<([^>]+)>)/gi, "");
  return sanitizedInput;
}

let notification_count_element = document.querySelector(".notification_count");
let notification_count = notification_count_element
  ? parseInt(notification_count_element.textContent) || 0
  : 0;

let notification_count_mobile_element = document.querySelector(
  ".notification_count_mobile"
);

function htmlForFriendRequests(
  sender_email,
  sender_avatar,
  sender_first_name,
  sender_last_name,
  sender_id,
  notification_id,
  img_url_saidan
) {
  let img_url = "";

  if (img_url_saidan == "shecvale linki") {
    img_url = `/static/media/${sender_avatar}`;
  } else {
    img_url = `/static${sender_avatar}`;
  }

  return `
        <div class="d-flex align-items-center gap-2 my-3">
          <a href="${location.protocol}//${location.host}/profile/${sender_email}">
            <img
              src="${img_url}"
              style="border-radius: 50%; width: 50px; height: 50px"
            />
          </a>
          <div style="display: flex; flex-direction: column">
            <span style="color: black">${sender_first_name} ${sender_last_name}
            <span style="font-size: 0.9rem">Sent You Friend Request</span>
            </span>
            <div class="d-flex gap-2">
              <button
                class="btn btn-success add_friend_appr"
                data-id="${sender_id}"
                data-notificationId="${notification_id}"
                style="padding: 2px 0; width: 100px"
              >
                Accept
              </button>
              <button
                class="btn btn-danger decline_friend_request"
                data-id="${sender_id}"
                data-notificationId="${notification_id}"
                style="padding: 2px 0; width: 100px"
              >
                Decline
              </button>
            </div>
          </div>
        </div>

      `;
}

function htmlForRejectOrAcceptNotifications(
  sender_first_name,
  sender_last_name,
  notification_id,
  text
) {
  return `
          <p
            style="
              color: black;
              background: #e0e0e0;
              padding: 0.5rem;
              margin-block: 0.5rem;
            "
          >
            ${sender_first_name} ${sender_last_name} ${text}
            <button
              class="delete_message_dec"
              data-id="${notification_id}"
              style="
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0.2rem;
                background: none;
                border: none;
              "
              type="button"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              data-bs-custom-class="custom-tooltip"
              data-bs-title="Delete Notification"
            >
              🗑️
            </button>
          </p>

      `;
}

function htmlForLikeCommentUnfriend(
  sender_email,
  sender_avatar,
  sender_first_name,
  sender_last_name,
  post_id,
  notification_id,
  img_url_saidan,
  unlikeorlike,
  text,
  type123,
  sender_id,
  nagdiPostId
) {
  let img_url = "";

  if (img_url_saidan == "shecvale linki") {
    img_url = `/static/media/${sender_avatar}`;
  } else {
    img_url = `/static${sender_avatar}`;
  }

  if (type123 == "comment") {
    return `
    
            <div
              class="d-flex align-items-center gap-2 my-3 container_for_like_notification container_For_comments container_for_unfriend_notification"
              style="background-color: #fff4e6; border-color: #fd7e14"
            >
              <a href="${location.protocol}//${
      location.host
    }/profile/${sender_email}">
                <img
                  src="${img_url}"
                  loading="lazy"
                  style="border-radius: 50%; width: 50px; height: 50px"
                />
              </a>
              <div style="display: flex; flex-direction: column; width: 80%">
                <span style="color: black; font-size: 0.9rem"
                  >${sender_first_name} ${sender_last_name}</span
                >
                <div>
                  <span style="font-size: 0.9rem">
                    Commented on Your Post:
                    <i> ${post_id.slice(0, 25)} </i>
                  </span>
                  <a
                    href="#"
                    type="button"
                    data-post_id="${nagdiPostId}"
                    data-comment_btn="yes"
                    data-sender_id="${sender_id}"
                    data-bs-toggle="modal"
                    data-bs-target="#staticBackdrop"
                    class="view_post_notifications"
                    style="font-size: 0.8rem; color: #007bff"
                    >View Post</a
                  >
                  <button
                    class="delete_message_dec"
                    data-id="${notification_id}"
                    style="
                      font-size: 1.2rem;
                      cursor: pointer;
                      padding: 0.2rem;
                      background: none;
                      border: none;
                    "
                    type="button"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    data-bs-custom-class="custom-tooltip"
                    data-bs-title="Delete Notification"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
    
    `;
  } else if (type123 == "shared_post") {
    return `
            <div
              class="d-flex align-items-center gap-2 my-3 container_for_like_notification container_for_unfriend_notification"
              style="background-color: #cadfff"
            >
              <a href="${location.protocol}//${location.host}/profile/${sender_email}">
                <img
                  src="${img_url}"
                  loading="lazy"
                  style="border-radius: 50%; width: 50px; height: 50px"
                />
              </a>
              <div style="display: flex; flex-direction: column">
                <span style="color: black"
                  >${sender_first_name} ${sender_last_name}</span
                >
                <div>
                  <span style="font-size: 0.9rem"> ${text} </span>
                  <a
                    href="#"
                    type="button"
                    data-post_id="${nagdiPostId}"
                    data-comment_btn="yes"
                    data-sender_id="${sender_id}"
                    data-bs-toggle="modal"
                    data-bs-target="#staticBackdrop"
                    class="view_post_notifications"
                    style="font-size: 0.8rem; color: #007bff"
                    >View Post</a
                  >
                  <button
                    class="delete_message_dec"
                    data-id="${notification_id}"
                    style="
                      font-size: 1.2rem;
                      cursor: pointer;
                      padding: 0.2rem;
                      background: none;
                      border: none;
                    "
                    type="button"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    data-bs-custom-class="custom-tooltip"
                    data-bs-title="Delete Notification"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
    `;
  } else {
    return `
  
    <div
        class="d-flex align-items-center gap-2 my-3 ${unlikeorlike} container_for_unfriend_notification"
      >
        <a href="${location.protocol}//${location.host}/profile/${sender_email}">
          <img
            src="${img_url}"
            loading="lazy"
            style="border-radius: 50%; width: 50px; height: 50px"
          />
        </a>
        <div style="display: flex; flex-direction: column; width: 80%">
          <span style="color: black"
            >${sender_first_name} ${sender_last_name}</span
          >
          <div>
            <span style="font-size: 0.9rem"> ${text} </span>
            <a
              href="#"
              type="button"
              data-post_id="${post_id}"
              data-bs-toggle="modal"
              data-bs-target="#staticBackdrop"
              class="view_post_notifications"
              style="font-size: 0.8rem; color: #007bff"
              >View Post</a
            >

            <button
              class="delete_message_dec"
              data-id="${notification_id}"
              style="
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0.2rem;
                background: none;
                border: none;
              "
              type="button"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              data-bs-custom-class="custom-tooltip"
              data-bs-title="Delete Notification"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

    `;
  }
}

// Function to remove a notification
function removeNotification(notification_id, button) {
  const data = {
    notification_id: notification_id,
  };

  sendRequest(
    "/friendship/DeleteNotifications/", // Your API endpoint for sending a friend request
    "POST", // HTTP method
    data, // Data to be sent
    function (response) {
      button.remove();

      notification_count_mobile_element = notification_count_mobile_element
        ? notification_count_mobile_element || notification_count_element
        : notification_count_element;

      let notification_count_mobile = notification_count_mobile_element
        ? parseInt(notification_count_mobile_element.textContent) ||
          notification_count
        : notification_count;

      notification_count--;
      notification_count_mobile--;

      notification_count_mobile_element.textContent = notification_count_mobile;
      notification_count_element.textContent = notification_count;
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

notification_count_mobile_element = notification_count_mobile_element
  ? notification_count_mobile_element || notification_count_element
  : notification_count_element;

let notification_count_mobile = notification_count_mobile_element
  ? parseInt(notification_count_mobile_element.textContent) ||
    notification_count
  : notification_count;

const ws = new WebSocket(`ws://${window.location.host}/ws/notifications/`);

ws.onmessage = function (e) {
  try {
    const notification = JSON.parse(e.data);

    notification_count++;
    notification_count_mobile++;

    notification_count_mobile_element.textContent = notification_count_mobile;
    notification_count_element.textContent = notification_count;

    if (notification.notification_type == "friend_request") {
      notificationsMenu.innerHTML =
        htmlForFriendRequests(
          notification.sender.email,
          notification.sender.avatar,
          notification.sender.first_name,
          notification.sender.last_name,
          notification.sender.id,
          notification.notification_id,
          "daikide"
        ) + notificationsMenu.innerHTML;

      // add accept and reject buttons
      const accept_requests_friend =
        document.querySelectorAll(".add_friend_appr");
      const reject_requests_friend = document.querySelectorAll(
        ".decline_friend_request"
      );

      accept_requests_friend.forEach((element) => {
        element.addEventListener("click", () => {
          const senderId = element.getAttribute("data-id");
          const notificationId = element.getAttribute("data-notificationId");

          sendAcceptRequest(senderId, element, notificationId);
        });
      });

      reject_requests_friend.forEach((element) => {
        element.addEventListener("click", () => {
          const senderId = element.getAttribute("data-id");
          const notificationId = element.getAttribute("data-notificationId");

          sendRejectRequest(senderId, element, notificationId);
        });
      });
    } else if (notification.notification_type == "friend_acceptance") {
      notificationsMenu.innerHTML =
        htmlForRejectOrAcceptNotifications(
          notification.receiver.first_name,
          notification.receiver.last_name,
          notification.notification_id,
          "has accepted your friend request."
        ) + notificationsMenu.innerHTML;
    } else if (notification.notification_type == "friend_rejection") {
      notificationsMenu.innerHTML =
        htmlForRejectOrAcceptNotifications(
          notification.receiver.first_name,
          notification.receiver.last_name,
          notification.notification_id,
          "has rejected your friend request."
        ) + notificationsMenu.innerHTML;
    } else if (notification.notification_type == "message") {
      let message_notification_div;

      if (
        document.querySelector(
          `[data-chatid="${notification.chatId}-send"][data-requestuseremail="${notification.receiver_email}"]`
        )
      ) {
        message_notification_div = document.querySelector(
          `[data-chatid="${notification.chatId}-send"][data-requestuseremail="${notification.receiver_email}"]`
        );

        message_notification_div.setAttribute(
          "data-chatid",
          `${notification.chatId}-received`
        );

        message_notification_div.classList.add("received_message_messageTab");

        const contentText =
          message_notification_div.querySelector(".message-text");

        const message_time =
          message_notification_div.querySelector(".message-time");

        contentText.textContent = `${notification.content}`;
        contentText.style.color = "#fff";

        message_time.textContent = `${notification.time}`;
      } else if (
        document.querySelector(
          `[data-chatid="${notification.chatId}-received"][data-requestuseremail="${notification.receiver_email}"]`
        )
      ) {
        message_notification_div = document.querySelector(
          `[data-chatid="${notification.chatId}-received"][data-requestuseremail="${notification.receiver_email}"]`
        );

        const contentText =
          message_notification_div.querySelector(".message-text");

        const message_time =
          message_notification_div.querySelector(".message-time");

        contentText.textContent = `${notification.content}`;

        message_time.textContent = `${notification.time}`;
      }

      if (soundPlayCount < 2) {
        notificationSound_message.play().catch((error) => {
          console.error("Error playing sound:", error);
        });
        soundPlayCount++;
      }
    }

    const delete_message_dec = document.querySelectorAll(".delete_message_dec");

    delete_message_dec.forEach((element) => {
      element.addEventListener("click", () => {
        const notificationId = element.getAttribute("data-id");

        removeNotification(notificationId, element.parentElement);
      });
    });
  } catch (error) {
    console.error("Error processing WebSocket message:", error);
  }
};

const delete_message_dec = document.querySelectorAll(".delete_message_dec");

if (delete_message_dec) {
  delete_message_dec.forEach((element) => {
    element.addEventListener("click", () => {
      const notificationId = element.getAttribute("data-id");

      const notificationContainer = element.closest(
        ".container_for_unfriend_notification"
      );

      const notificationcommentContainer = element.closest(
        ".container_For_comments"
      );

      if (notificationContainer) {
        removeNotification(notificationId, notificationContainer);
      } else if (notificationcommentContainer) {
        removeNotification(
          notificationId,
          element.parentElement.parentElement.parentElement
        );
      } else {
        removeNotification(notificationId, element.parentElement);
      }
    });
  });
}

// add accept and reject buttons
const accept_requests_friend = document.querySelectorAll(".add_friend_appr");
const reject_requests_friend = document.querySelectorAll(
  ".decline_friend_request"
);

if (accept_requests_friend) {
  accept_requests_friend.forEach((element) => {
    element.addEventListener("click", () => {
      const senderId = element.getAttribute("data-id");
      const notificationId = element.getAttribute("data-notificationId");

      sendAcceptRequest(senderId, element, notificationId);
    });
  });
}

if (reject_requests_friend) {
  reject_requests_friend.forEach((element) => {
    element.addEventListener("click", () => {
      const senderId = element.getAttribute("data-id");
      const notificationId = element.getAttribute("data-notificationId");

      sendRejectRequest(senderId, element, notificationId);
    });
  });
}

function refreshTokenAndRetryForNotification(retryCallback) {
  sendRequest(
    "/auth/token/refresh/",
    "POST",
    {}, // No additional data needed for token refresh
    function (data) {
      console.log("Token refreshed successfully", data);
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

let offset = 7;
const limit = 6;
let loading = false;
let hasMoreNotifications = true;

function loadNotifications() {
  // Prevent loading if it's already happening or there are no more notifications
  if (loading || !hasMoreNotifications) return;

  loading = true; // Set the loading state to true to avoid multiple requests

  // Use the sendRequest function to fetch the notifications
  sendRequest(
    `/notifications/api/notifications/?limit=${limit}&offset=${offset}`, // URL with limit and offset parameters
    "GET", // HTTP method
    null, // No body needed for GET request
    (data) => {
      if (
        data.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // If authentication fails, refresh the token and retry
        refreshTokenAndRetryForNotification(() => loadNotifications());
      } else {
        // Extract notifications and total count from the response
        const notifications = data.notifications;
        const totalCount = data.total_count;

        console.log(notifications);

        // Append the fetched notifications to the DOM
        appendNotificationsToDOM(notifications);

        // Update the offset for the next request
        if (notifications.length > 0) {
          offset += limit;
        }

        // If the offset exceeds or equals the total notifications, stop further requests
        if (offset >= totalCount) {
          hasMoreNotifications = false;
        }

        loading = false; // Reset the loading state to allow future requests
      }
    },
    (error) => {
      // Handle any errors that occur during the fetch
      console.error("Error fetching notifications:", error);
      loading = false; // Ensure loading state is reset even after an error
    }
  );
}

function appendNotificationsToDOM(notifications) {
  // A placeholder function to add notifications to the page.
  notifications.forEach((notification) => {
    notification_count++;
    notification_count_mobile++;

    notification_count_mobile_element.textContent = notification_count_mobile;
    notification_count_element.textContent = notification_count;

    if (notification.notification_type == "friend_request") {
      notificationsMenu.innerHTML =
        notificationsMenu.innerHTML +
        htmlForFriendRequests(
          notification.sender_email,
          notification.sender_avatar,
          notification.sender_first_name,
          notification.sender_last_name,
          notification.sender_id,
          notification.id,
          "shecvale linki"
        );

      // add accept and reject buttons
      const accept_requests_friend =
        document.querySelectorAll(".add_friend_appr");
      const reject_requests_friend = document.querySelectorAll(
        ".decline_friend_request"
      );

      accept_requests_friend.forEach((element) => {
        element.addEventListener("click", () => {
          const senderId = element.getAttribute("data-id");
          const notificationId = element.getAttribute("data-notificationId");

          sendAcceptRequest(senderId, element, notificationId);
        });
      });

      reject_requests_friend.forEach((element) => {
        element.addEventListener("click", () => {
          const senderId = element.getAttribute("data-id");
          const notificationId = element.getAttribute("data-notificationId");

          sendRejectRequest(senderId, element, notificationId);
        });
      });
    } else if (notification.notification_type == "friend_acceptance") {
      notificationsMenu.innerHTML =
        notificationsMenu.innerHTML +
        htmlForRejectOrAcceptNotifications(
          notification.sender_first_name,
          notification.sender_last_name,
          notification.id,
          "has accepted your friend request."
        );
    } else if (notification.notification_type == "friend_rejection") {
      notificationsMenu.innerHTML =
        notificationsMenu.innerHTML +
        htmlForRejectOrAcceptNotifications(
          notification.sender_first_name,
          notification.sender_last_name,
          notification.id,
          "has rejected your friend request."
        );
    } else if (notification.notification_type == "post_like") {
      notificationsMenu.innerHTML =
        notificationsMenu.innerHTML +
        htmlForLikeCommentUnfriend(
          notification.sender_email,
          notification.sender_avatar,
          notification.sender_first_name,
          notification.sender_last_name,
          parseInt(notification.message),
          notification.id,
          "shecvale linki",
          "container_for_like_notification",
          "Liked your post",
          "no",
          "araris aq post id"
        );
    } else if (notification.notification_type == "post_unlike") {
      notificationsMenu.innerHTML =
        notificationsMenu.innerHTML +
        htmlForLikeCommentUnfriend(
          notification.sender_email,
          notification.sender_avatar,
          notification.sender_first_name,
          notification.sender_last_name,
          parseInt(notification.message),
          notification.id,
          "shecvale linki",
          "container_for_unlike_notification",
          "UnLiked your post",
          "no",
          "araris aq post id"
        );
    } else if (notification.notification_type == "post_comment") {
      notificationsMenu.innerHTML =
        notificationsMenu.innerHTML +
        htmlForLikeCommentUnfriend(
          notification.sender_email,
          notification.sender_avatar,
          notification.sender_first_name,
          notification.sender_last_name,
          notification.message,
          notification.id,
          "shecvale linki",
          "container_for_unlike_notification",
          "Commented on your post",
          "comment",
          notification.sender_id,
          notification.post_Id
        );
    } else if (notification.notification_type == "post_shared") {
      notificationsMenu.innerHTML =
        notificationsMenu.innerHTML +
        htmlForLikeCommentUnfriend(
          notification.sender_email,
          notification.sender_avatar,
          notification.sender_first_name,
          notification.sender_last_name,
          notification.message,
          notification.id,
          "shecvale linki",
          "container_for_unlike_notification",
          "Shared your post",
          "shared_post",
          notification.sender_id,
          notification.post_Id
        );
    }
  });

  // add accept and reject buttons
  const accept_requests_friend = document.querySelectorAll(".add_friend_appr");
  const reject_requests_friend = document.querySelectorAll(
    ".decline_friend_request"
  );

  if (accept_requests_friend) {
    accept_requests_friend.forEach((element) => {
      element.addEventListener("click", () => {
        const senderId = element.getAttribute("data-id");
        const notificationId = element.getAttribute("data-notificationId");

        sendAcceptRequest(senderId, element, notificationId);
      });
    });
  }

  if (reject_requests_friend) {
    reject_requests_friend.forEach((element) => {
      element.addEventListener("click", () => {
        const senderId = element.getAttribute("data-id");
        const notificationId = element.getAttribute("data-notificationId");

        sendRejectRequest(senderId, element, notificationId);
      });
    });
  }

  const delete_message_dec = document.querySelectorAll(".delete_message_dec");

  if (delete_message_dec) {
    delete_message_dec.forEach((element) => {
      element.addEventListener("click", () => {
        const notificationId = element.getAttribute("data-id");

        const notificationContainer = element.closest(
          ".container_for_unfriend_notification"
        );

        if (notificationContainer) {
          removeNotification(notificationId, notificationContainer);
        } else {
          removeNotification(notificationId, element.parentElement);
        }
      });
    });
  }
}

const modalBody = document.querySelector("#notificationTabContent");

modalBody.addEventListener("scroll", () => {
  if (modalBody.scrollTop + modalBody.clientHeight >= modalBody.scrollHeight) {
    loadNotifications();
  }
});

const notifications_modal_body = document.getElementById(
  "notifications_modal_body_ID"
);

const addCommentsnotificationPostModalBody = document.querySelector(
  ".modal-body-for-post-notifications"
);

notifications_modal_body.addEventListener("click", function (event) {
  if (event.target.classList.contains("view_post_notifications")) {
    const element = event.target;

    event.preventDefault();

    const notificationId = element.getAttribute("data-post_id");
    const senderId = element.getAttribute("data-sender_id");

    let post_data = {
      post_id: notificationId,
      comment: "",
    };

    if (element.dataset.comment_btn) {
      post_data.comment = "yes";
    }

    document.querySelector(".alertText").textContent = "Post Will Open Soon...";
    document.querySelector(".magariAlteri2").classList.add("show");
    document.querySelector(".magariAlteri2").classList.remove("hide");
    document.querySelector(".magariAlteri2").style.zIndex = 123123;

    $.ajax({
      type: "POST",
      url: `${location.protocol}//${location.host}/posts/postForNotification/`,
      headers: {
        "X-CSRFToken": csrftoken,
      },
      data: JSON.stringify(post_data),
      contentType: "application/json",
      credentials: "include",
      success: function (response) {
        if (response.success) {
          const post_cont = document.querySelector(
            ".modal_body_for_post_likeUnliked"
          );

          const post = response.data;
          const author = post.author;
          const media_type = post.media_type;
          const media = post.media;
          const likes_count = post.user_likes;
          const tags = post.tags.map((tag) => `#${tag}`).join(" "); // Convert tags array to string

          // Prepare the comment section
          const comments = post.comments;

          // Prepare HTML by inserting dynamic data
          post_cont.innerHTML = `
            <article class="post feed-posts">
                <div class="post-header justify-content-between">
                    <div class="d-flex">
                        <a href="${location.protocol}//${
            location.host
          }/profile/${author.email}">
                          <img
                            src="/static${author.avatar}"
                            loading="lazy"
                            alt="User Avatar"
                          />
                        </a>
                        <div class="post-user-info" style="align-self: flex-end">
                            <h4>${author.first_name} ${author.last_name}</h4>
                            <p>Posted ${post.created_at} ago</p>
                        </div>
                    </div>
                </div>

                <div class="post-content">
                    <p class="post_text_edit_for">${post.title}</p>

                    ${
                      media_type === "video"
                        ? `
                        <video controls>
                            <source src="${media}" loading="lazy" type="video/mp4" class="video_post_source" />
                            Your browser does not support the video tag.
                        </video>
                    `
                        : media_type === "image"
                        ? `
                        <div class="media">
                            <img src="${media}" alt="Post Image" class="post_media_file" loading="lazy" />
                        </div>
                    `
                        : ""
                    }

                    <div class="tags mt-2">
                        ${tags}
                    </div>
                </div>

                <div class="post-actions">
                    <div class="like-section">
                        <button class="btn" disabled>👍 Like</button>
                        <span class="like-count"><span class="like_countNumber">${likes_count}</span> Likes</span>
                    </div>
                </div>

                          ${
                            comments.length > 0
                              ? `
                              <details>
                                  <summary>View Comments</summary>
                                  <div>
                                      <div class="add-comment">
                                          <input type="text" placeholder="Write a comment..." class="comment_input" />
                                          <button class="addCommentOnPost" data-post_id="${notificationId}">Post</button>

                                          <div class="comments">
                                              ${comments
                                                .map(
                                                  (comment) => `
                                                  <div class="comment" style="
                                                      display: flex;
                                                      align-items: center;
                                                      justify-content: space-between;
                                                      background-color: ${
                                                        comment.user__id ==
                                                        senderId
                                                          ? "#bfbdbd"
                                                          : "#f9f9f9"
                                                      };
                                                  ">
                                                      <p style="margin: 0">
                                                          <strong>${
                                                            comment.user__first_name
                                                          } ${
                                                    comment.user__last_name
                                                  }:</strong> ${comment.text}
                                                      </p>
                                                  </div>
                                              `
                                                )
                                                .join("")}
                                          </div>
                                      </div>
                                  </div>
                              </details>
                              `
                              : ""
                          }
            </article>
          `;

          document.querySelector(".magariAlteri2").classList.remove("show");
          document.querySelector(".magariAlteri2").classList.add("hide");

          console.log(addCommentsnotificationPostModalBody);

          addCommentsnotificationPostModalBody.addEventListener(
            "click",
            (event) => {
              if (event.target.classList.contains("addCommentOnPost")) {
                const element = event.target;

                console.log(element);
                const parentEl = element.parentElement;
                const commentInput = parentEl.querySelector(".comment_input");
                const comment_cont = parentEl.querySelector(".comments");

                if (sanitizeInput(commentInput.value.trim())) {
                  toggleComment(
                    element.dataset.post_id,
                    element,
                    sanitizeInput(commentInput.value.trim()),
                    comment_cont,
                    "post_post"
                  );
                }
              }
            }
          );
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  }
});
