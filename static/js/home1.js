function scrollToBottom() {
  const chatContainer = document.querySelector(".chat-body");
  chatContainer.scrollTop =
    chatContainer.scrollHeight - chatContainer.clientHeight;
}

// Open the chat window when a friend is clicked
document.querySelectorAll(".friend").forEach((friend) => {
  friend.addEventListener("click", function () {
    const chatWindow = document.getElementById("chat-window");
    const chatFriendName = document.getElementById("chat-friend-name");
    const friendName = friend
      .querySelector(".friend_name")
      .getAttribute("data-name");
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

// these are for the create post

let show_create_post = document.querySelector("#create-post");
let hide_create_post = document.querySelector(".cross-icon-mark");

show_create_post.addEventListener("click", () => {
  document.querySelector(".post-create-post").style.display = "block";
});

hide_create_post.addEventListener("click", () => {
  document.querySelector(".post-create-post").style.display = "none";
});

const textarea = document.querySelector("#post-desc");
const postBtn = document.querySelector(".post-btn");
const createPostSection = document.querySelector(".create-post2");

document.body.style.overflowX = "none";

textarea.addEventListener("input", () => {
  if (textarea.value != "") postBtn.disabled = false;
  else postBtn.disabled = true;
});

document.getElementById("media").addEventListener("change", function (event) {
  const file = event.target.files[0];
  const imagePreview = document.getElementById("image-preview");
  const videoPreview = document.getElementById("video-preview");
  const removeButton = document.getElementById("remove-preview");

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      if (file.type.startsWith("image/")) {
        // If file is an image
        imagePreview.src = e.target.result;
        imagePreview.style.display = "block"; // Show the image preview
        videoPreview.style.display = "none"; // Hide the video preview
      } else if (file.type.startsWith("video/")) {
        // If file is a video
        videoPreview.src = e.target.result;
        videoPreview.style.display = "block"; // Show the video preview
        imagePreview.style.display = "none"; // Hide the image preview
      }
      removeButton.style.display = "inline-block"; // Show the remove button
    };

    reader.readAsDataURL(file);
  } else {
    imagePreview.src = "";
    imagePreview.style.display = "none"; // Hide the image preview if no file is selected
    videoPreview.src = "";
    videoPreview.style.display = "none"; // Hide the video preview if no file is selected
    removeButton.style.display = "none"; // Hide the remove button if no file is selected
  }
});

document
  .getElementById("remove-preview")
  .addEventListener("click", function () {
    document.getElementById("media").value = ""; // Clear the file input
    document.getElementById("image-preview").src = "";
    document.getElementById("image-preview").style.display = "none"; // Hide the image preview
    document.getElementById("video-preview").src = "";
    document.getElementById("video-preview").style.display = "none"; // Hide the video preview
    this.style.display = "none"; // Hide the remove button
  });

function isMobileDevice() {
  return window.innerWidth <= 768; // Mobile is typically considered to be 768px or less
}

let friend_list_button = document.querySelector(".gamochndeba_roca_mobile");
let gavaqro_megobrebi = document.querySelector(".gavaqro_megobrebi");

// Toggle friend list on mobile
friend_list_button.addEventListener("click", (e) => {
  e.preventDefault();
  document.querySelector(".magariaside").style.display = "flex";
});

gavaqro_megobrebi.addEventListener("click", (e) => {
  e.preventDefault();

  // Check if the device is mobile before hiding the friend list
  if (isMobileDevice()) {
    document.querySelector(".magariaside").style.display = "none";
  }
});
