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

/////////////////// es kodi aqamde ///////////////////
const tagsWrapper = document.getElementById("tags-wrapper");

// Limit tag selection to 5
const tagCheckboxes = document.querySelectorAll(".tag-checkbox");
let selectedTags = 0;

tagCheckboxes.forEach(function (checkbox) {
  checkbox.addEventListener("change", function () {
    if (this.checked) {
      selectedTags++;
    } else {
      selectedTags--;
    }

    if (selectedTags > 5) {
      this.checked = false;
      selectedTags--;
      alert("You can only select up to 5 tags.");
    }
  });
});

function checkFormValidity() {
  const isTextFilled = textarea.value.trim() !== "";
  const isTagSelected =
    tagsWrapper.querySelector('input[type="checkbox"]:checked') !== null;

  if (isTextFilled && isTagSelected) {
    postBtn.removeAttribute("disabled"); // Enable the button
  } else {
    postBtn.setAttribute("disabled", ""); // Disable the button
  }
}

// Event listeners
textarea.addEventListener("input", checkFormValidity);

tagsWrapper.addEventListener("change", checkFormValidity);

/////////////////// es kodi aqamde ///////////////////

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

const create_post_btn = document.getElementById("create_post--btn");

if (create_post_btn) {
  create_post_btn.addEventListener("click", function () {
    selectedTags = 0;
  });
}

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
