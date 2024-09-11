// JavaScript to handle image click and modal display
document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll(".media-images .photo-grid img");

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `<button class="modal-close">&times;</button><img src="" alt="Enlarged Image" />`;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector("img");
  const closeModal = modal.querySelector(".modal-close");

  images.forEach((image) => {
    image.addEventListener("click", () => {
      modalImg.src = image.src;
      modal.classList.add("open");
    });
  });

  closeModal.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  // Close modal if clicked outside of the image
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("open");
    }
  });

  // Open the chat window when a friend is clicked
  document.querySelectorAll(".friend").forEach((friend) => {
    friend.addEventListener("click", function () {
      const chatWindow = document.getElementById("chat-window");
      const chatFriendName = document.getElementById("chat-friend-name");
      const friendName = friend.getAttribute("data-name");
      chatFriendName.textContent = `Chat with ${friendName}`;

      chatWindow.classList.remove("chat-hidden");

      scrollToBottom();
    });
  });

  // Close the chat window
  document.getElementById("close-chat").addEventListener("click", function () {
    const chatWindow = document.getElementById("chat-window");
    chatWindow.classList.add("chat-hidden");
  });
});

function scrollToBottom() {
  const chatContainer = document.querySelector(".chat-body");
  chatContainer.scrollTop =
    chatContainer.scrollHeight - chatContainer.clientHeight;
}

const location_btn = document.querySelector(".add-location-btn");
const job_btn = document.querySelector(".add-job-btn");

const job_input = document.querySelector(".input-and-add-button-job");
const location_input = document.querySelector(".input-and-add-button-location");

location_btn.addEventListener("click", () => {
  location_btn.style.display = "none";

  location_input.classList.remove("d-none");
});

job_btn.addEventListener("click", () => {
  job_btn.style.display = "none";

  job_input.classList.remove("d-none");
});
