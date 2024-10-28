function scrollToBottom2() {
  const chatWindow = document.getElementById("chat-window");
  const chatContainer = chatWindow.querySelector(".chat-body");

  chatContainer.scrollTop =
    chatContainer.scrollHeight - chatContainer.clientHeight;
}

let socketConnectionForChat;

function sanitizeInput(userInput) {
  // Remove all HTML tags from user input
  let sanitizedInput = userInput.replace(/(<([^>]+)>)/gi, "");
  return sanitizedInput;
}

const chatWindow = document.getElementById("chat-window");
const send_messages__btn = document.querySelector(".send_messages--btn");

function displayMessages(messages, start_con, requestUserEmail) {
  const chatBox = document.getElementById("chat-window");
  const chat_body = chatBox.querySelector(".chat-body");
  chat_body.innerHTML = ""; // Clear previous messages

  if (start_con) {
    const startConHtml = `
      <p class="startCon" style="text-align: center">${start_con}</p>
    `;
    chat_body.innerHTML = startConHtml;
  } else {
    messages.forEach((message) => {
      let messageHtml = ``;

      if (message.receiver_email == requestUserEmail) {
        messageHtml = `
          <div class="message-wrapper d-flex flex-column align-items-start">
            <div class="d-flex align-items-center">
              <div class="message received" style="max-width: 100%" data-deltemes2="${message.id}">
                <p style="margin-bottom: 0;">${message.content}</p>
              </div>
            </div>
          </div>
          `;
      } else {
        messageHtml = `
          <div class="message-wrapper d-flex flex-column align-items-end">
            <div class="d-flex align-items-center">
              <div class="message-options me-2">
                <button class="btn btn-link p-0" data-bs-toggle="dropdown">
                  &#x2022;&#x2022;&#x2022;
                </button>
                <ul class="dropdown-menu" style="padding: 5px;">
                  <li><a class="dropdown-item delete_message_chat" href="#" data-deltemes="${message.id}" style="font-size: 0.8rem;">Delete</a></li>
                </ul>
              </div>
              <div class="message sent" style="max-width: 100%" data-deltemes2="${message.id}">
                <p style="margin-bottom: 0;">${message.content}</p>
              </div>
            </div>
          </div>
        `;
      }
      chat_body.innerHTML += messageHtml;
    });

    const delete_message_chat = document.querySelectorAll(
      ".delete_message_chat"
    );

    delete_message_chat.forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        const message_id = element.getAttribute("data-deltemes");

        deleteMessage(message_id, true);
      });
    });
  }
}

document.querySelectorAll(".friend").forEach((friend) => {
  friend.addEventListener("click", function () {
    const chatFriendName = document.getElementById("chat-friend-name");
    const chatFriendPhoto = document.querySelector(".chat-friend-photo");
    const userEmail = friend.getAttribute("data-useremail");
    const requestUserEmail = friend.getAttribute("data-requestuseremail");
    const chatFriendIMG = friend.getAttribute("data-userphoto");

    send_messages__btn.setAttribute("data-receiver_email", userEmail);
    send_messages__btn.setAttribute("data-sender_email", requestUserEmail);

    let friendName = friend.querySelector(".friend_name");

    if (!friendName) {
      friendName = friend.getAttribute("data-name");
    } else {
      friendName = friend
        .querySelector(".friend_name")
        .getAttribute("data-name");
    }

    chatFriendName.textContent = `${friendName}`;

    chatFriendPhoto.src = chatFriendIMG;

    chatWindow.classList.remove("chat-hidden");

    function getChatMessages() {
      $.ajax({
        url: `${location.protocol}//${location.host}/chat/${userEmail}/fetch_chat_for_user/`,
        type: "GET",
        headers: {
          "X-CSRFToken": csrftoken,
          "Content-Type": "application/json",
        },
        credentials: "include",
        success: function (response) {
          console.log(response);

          if (response.start_con) {
            displayMessages(null, response.start_con, requestUserEmail);
          } else if (response.user_not_found) {
            document.querySelector(".alertText").textContent =
              "Error User Not Found!";
            document.querySelector(".magariAlteri2").classList.add("show");
            document.querySelector(".magariAlteri2").classList.remove("hide");
            document.querySelector(".magariAlteri2").style.zIndex = 123123;
          } else if (response.other_errors) {
            document.querySelector(".alertText").textContent =
              "Something went wrong try again!";
            document.querySelector(".magariAlteri2").classList.add("show");
            document.querySelector(".magariAlteri2").classList.remove("hide");
            document.querySelector(".magariAlteri2").style.zIndex = 123123;
          } else {
            displayMessages(response.messages, null, requestUserEmail);

            scrollToBottom2();
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", xhr);
          console.log("Could not retrieve chat messages. Please try again.");
        },
      });
    }

    getChatMessages();

    const chatId = [
      sanitizeInput(userEmail.replace(/[@.]/g, "")),
      sanitizeInput(requestUserEmail.replace(/[@.]/g, "")),
    ]
      .sort()
      .join("-");

    initializeWebSocket(chatId);
  });
});

// Close the chat window
document.getElementById("close-chat").addEventListener("click", function () {
  const chatWindow = document.getElementById("chat-window");
  chatWindow.classList.add("chat-hidden");

  socketConnectionForChat.close(1000, "User closed chat");
});

const messageInputChat = chatWindow.querySelector(".messageInputChatr");

messageInputChat.addEventListener("input", () => {
  const messageInput = messageInputChat.value.trim();

  if (sanitizeInput(messageInput)) {
    send_messages__btn.removeAttribute("disabled");
    send_messages__btn.textContent = "Send";
  } else {
    send_messages__btn.setAttribute("disabled", "true");
  }
});

function initializeWebSocket(chatId) {
  if (socketConnectionForChat) {
    socketConnectionForChat.close();
  }

  socketConnectionForChat = new WebSocket(
    `ws://${location.host}/ws/chat/messages/${chatId}/`
  );

  socketConnectionForChat.onmessage = function (e) {
    const data = JSON.parse(e.data);
    console.log(data);
    const chat_body = chatWindow.querySelector(".chat-body");

    if (data.message == "Deleted 54353") {
      deleteMessageUi(data.message_id);
    } else {
      if (
        data.sender_email ===
        send_messages__btn.getAttribute("data-sender_email")
      ) {
        chat_body.innerHTML += `
          <div class="message-wrapper d-flex flex-column align-items-end">
            <div class="d-flex align-items-center">
              <div class="message-options me-2">
                <button class="btn btn-link p-0" data-bs-toggle="dropdown">
                  &#x2022;&#x2022;&#x2022;
                </button>
                <ul class="dropdown-menu" style="padding: 5px;">
                  <li><a class="dropdown-item delete_message_chat" href="#" data-deltemes="${data.message_id}" style="font-size: 0.8rem;">Delete</a></li>
                </ul>
              </div>
              <div class="message sent" style="max-width: 100%" data-deltemes2="${data.message_id}">
                <p style="margin-bottom: 0;">${data.message}</p>
              </div>
            </div>
          </div>
        `;
      } else {
        chat_body.innerHTML += `
          <div class="message-wrapper d-flex flex-column align-items-start">
            <div class="d-flex align-items-center">
              <div class="message received" data-deltemes2="${data.message_id}" style="max-width: 100%">
                <p style="margin-bottom: 0;">${data.message}</p>
              </div>
            </div>
          </div>
        `;
      }

      scrollToBottom2();

      send_messages__btn.textContent = "Sent";

      const delete_message_chat = document.querySelectorAll(
        ".delete_message_chat"
      );

      delete_message_chat.forEach((element) => {
        element.addEventListener("click", (e) => {
          e.preventDefault();
          const message_id = element.getAttribute("data-deltemes");

          deleteMessage(message_id, true);
        });
      });
    }
  };

  socketConnectionForChat.onerror = function (error) {
    console.error("WebSocket Error:", error);

    document.querySelector(".alertText").textContent =
      "Something went wrong try again!";
    document.querySelector(".magariAlteri2").classList.add("show");
    document.querySelector(".magariAlteri2").classList.remove("hide");
    document.querySelector(".magariAlteri2").style.zIndex = 123123;
  };
}

send_messages__btn.addEventListener("click", () => {
  const messageInput = sanitizeInput(messageInputChat.value.trim());
  const receiverEmail = send_messages__btn.getAttribute("data-receiver_email");

  send_messages__btn.textContent = "Wait...";

  if (messageInput != "") {
    sendMessage(messageInput, receiverEmail, false);
  }

  messageInputChat.value = "";
});

function sendMessage(messageInput, receiverEmail, delete_messageTR = false) {
  if (
    socketConnectionForChat &&
    socketConnectionForChat.readyState === WebSocket.OPEN
  ) {
    socketConnectionForChat.send(
      JSON.stringify({
        content: messageInput,
        receiver: receiverEmail,
        delete_messageOrNot: delete_messageTR,
      })
    );
  } else {
    console.error("WebSocket is not open. Cannot send message.");
  }
}

function deleteMessage(messageId, delete_messageTR = true) {
  if (
    socketConnectionForChat &&
    socketConnectionForChat.readyState === WebSocket.OPEN
  ) {
    socketConnectionForChat.send(
      JSON.stringify({
        message_id: messageId,
        delete_messageOrNot: delete_messageTR,
      })
    );
  } else {
    console.error("WebSocket is not open. Cannot send message.");
  }
}

function deleteMessageUi(message_id) {
  let messageDiv = document.querySelector(`[data-deltemes2="${message_id}"]`);

  messageDiv.textContent = "Message Deleted";

  messageDiv.style.backgroundColor = "transparent";
  messageDiv.style.color = "black";
  messageDiv.style.border = "1px solid";
}
