import {
  sendRequestInUtility,
  refreshTokenAndRetryInUtility,
} from "./utility.js";

const form = document.getElementById("post-form");

const create_post_btn = document.getElementById("create_post--btn");

if (create_post_btn) {
  create_post_btn.addEventListener("click", function (event) {
    event.preventDefault();

    document.querySelector(".post-create-post").style.display = "none";

    const formData = new FormData(form);
    const postBtn = document.getElementById("create_post--btn");
    const progressModal = document.querySelector(
      ".modal-for-progressbar-create_post"
    );
    const progressFill = document.querySelector(".progress-fill");

    // Disable the submit button
    postBtn.disabled = true;

    // Show the progress modal
    progressModal.style.display = "flex";

    // Create a new XMLHttpRequest
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.onprogress = function (event) {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        if (percentComplete < 90) {
          progressFill.style.width = percentComplete + "%"; // Update the progress bar smoothly up to 90%
        }
      }
    };

    // Handle the request response
    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);

        if (response.success) {
          // Post was successfully created
          // Artificially increase the progress from 90% to 100% with smooth increments
          smoothProgress(90, 100, 1000, function () {
            // After progress reaches 100%, hide the modal
            setTimeout(function () {
              document.getElementById("post-form").reset();
              progressModal.style.display = "none";
              postBtn.disabled = false;
              progressFill.style.width = "0%";

              // Insert the new post into the page dynamically
              const postContainer = document.getElementById("news-feed");
              postContainer.insertAdjacentHTML(
                "afterbegin",
                response.post_html
              );
            }, 500); // Short delay before resetting form
          });
        } else if (
          (response.errors.video =
            "Video file is too large. Maximum size allowed is 10MB.")
        ) {
          document.querySelector(".magariAlteri").classList.add("show");
          document.querySelector(".magariAlteri").classList.remove("hide");
          document.querySelector(".magariAlteri").style.zIndex = 123123;

          progressModal.style.display = "none";
          progressFill.style.width = "0%";
          postBtn.disabled = false;
        } else {
          alert("Error creating post.");
          progressModal.style.display = "none";
          progressFill.style.width = "0%";
          postBtn.disabled = false;
        }
      } else {
        alert("An error occurred while creating the post.");
        progressModal.style.display = "none";
        progressFill.style.width = "0%";
        postBtn.disabled = false;
      }
    };

    // Open the connection and send the form data
    xhr.open(
      "POST",
      `${location.protocol}//${location.host}/posts/createPost/`
    );
    xhr.setRequestHeader("X-CSRFToken", formData.get("csrfmiddlewaretoken"));
    xhr.send(formData);
  });
}

// Function to artificially slow the progress bar from 90% to 100%
function smoothProgress(start, end, duration, callback) {
  const progressFill = document.querySelector(".progress-fill");
  const stepTime = Math.abs(Math.floor(duration / (end - start)));
  let current = start;

  const interval = setInterval(function () {
    current++;
    progressFill.style.width = current + "%";

    if (current >= end) {
      clearInterval(interval);
      if (callback) callback(); // Call the callback function when progress reaches 100%
    }
  }, stepTime);
}

////////////////////////// delete post /////////////////////////////

function deletePostJsFIle(data, parentEl, timerId) {
  sendRequestInUtility(
    "/posts/deletePost/",
    "POST",
    data,
    function (response) {
      console.log(response);

      if (response.message == "Post deleted successfully") {
        parentEl.remove();
        timerId.textContent = "Post Deleted successfully";

        setTimeout(() => {
          timerId.style.display = "none";
        }, 2000);
      }
    },
    function (xhr) {
      if (
        xhr.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() =>
          deletePostJsFIle(data, parentEl, timerId)
        ); // Retry after refreshing token
      }
    }
  );
}

const delete_post_btn = document.querySelectorAll(".delete_post--btn");

delete_post_btn.forEach((element) => {
  element.addEventListener("click", () => {
    const post_id = element.dataset.postid;
    const parentEl =
      element.parentElement.parentElement.parentElement.parentElement;

    let imageSrc_for_userMedia = "";
    const image_to_delete = parentEl.querySelector(".post_media_file");

    if (image_to_delete) {
      imageSrc_for_userMedia = image_to_delete.getAttribute("src").slice(7);
    } else {
      imageSrc_for_userMedia = "video";
    }

    const data = {
      post_id: post_id,
      imageSrc_for_userMedia: imageSrc_for_userMedia,
    };

    let alert23 = document.querySelector(".alert-success");
    alert23.textContent = "Deleting Post";

    alert23.style.display = "block";

    deletePostJsFIle(data, parentEl, alert23);
  });
});

///////////////////////////////// edit post /////////////////////////////////////

const editButtons = document.querySelectorAll(".edit_post--btn");
let editPostModal;
const location_window = "http://127.0.0.1:8000/";
if (window.location.href != location_window) {
  editPostModal = new bootstrap.Modal(document.getElementById("editPostModal"));
}

function populateModalWithData(response) {
  // Set post text and ID
  document.getElementById("editPostText").value = response.data.text;
  document.getElementById("editPostId").value = response.data.id;

  // Set the tags
  document.querySelectorAll(".tag-checkbox").forEach((element) => {
    if (
      response.data.tags.includes(element.dataset.name_tag.toLocaleLowerCase())
    ) {
      element.checked = true;
      element.classList.add("alreadyCheckedTags");
    } else {
      element.classList.add("alreadyCheckedTagsNO");
    }
  });

  // Set media (image or video)
  const currentMediaDiv = document.getElementById("currentMedia");
  currentMediaDiv.innerHTML = ""; // Clear previous media

  if (response.data.media_type === "image") {
    currentMediaDiv.innerHTML = `<img src="/static${response.data.media}" alt="Post Image" style="max-width: 40%;"  class="img-fluid mb-2">`;
  } else if (response.data.media_type === "video") {
    currentMediaDiv.innerHTML = `
      <video controls class="img-fluid">
        <source src="/static${response.data.media}" type="video/mp4">
        Your browser does not support the video tag.
      </video>`;
  }

  // Show modal
  editPostModal.show();

  // Initial validation
  validateForm(response.data.text, response.data.tags);
}

// Validate form: enable or disable save button based on input changes
function validateForm(originalText, originalTags) {
  const editPostText = document.querySelector("#editPostText");
  const tagsWrapper = document.querySelector("#tags-wrapper");

  // Get the current state of the text field and tags
  const isTextModified = editPostText.value.trim() !== originalText.trim();
  const selectedTags = Array.from(
    tagsWrapper.querySelectorAll(".tag-checkbox:checked")
  ).map((tag) => tag.dataset.name_tag.toLowerCase());

  // Compare selected tags with original tags
  const isTagsModified =
    selectedTags.sort().join(",") !== originalTags.sort().join(",");

  // Enable the button if text or tags have changed
  const saveButton = document.querySelector(".edit_post_save_button_modal");
  if (isTextModified || isTagsModified) {
    saveButton.removeAttribute("disabled");
  } else {
    saveButton.setAttribute("disabled", "true");
  }
}

function EditPostJsFIle(postId) {
  sendRequestInUtility(
    `/posts/${postId}/edit/`,
    "GET",
    null,
    function (response) {
      console.log(response);

      if (
        response.detail ==
        "Authentication credentials were not provided or are invalid."
      ) {
        refreshTokenAndRetryInUtility(() => EditPostJsFIle(postId));
      }

      populateModalWithData(response);

      // Trigger validation on text and tag changes
      const editPostText = document.querySelector("#editPostText");
      const tagCheckboxes = document.querySelectorAll(".tag-checkbox");

      // Listen for text input changes
      editPostText.addEventListener("input", function () {
        validateForm(response.data.text, response.data.tags);
      });

      // Listen for tag checkbox changes
      tagCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", function () {
          validateForm(response.data.text, response.data.tags);
        });
      });

      // add validation for media
      document
        .getElementById("editPostMedia")
        .addEventListener("change", function (event) {
          const saveButton = document.querySelector(
            ".edit_post_save_button_modal"
          );
          const currentMediaDiv = document.getElementById("currentMedia");
          currentMediaDiv.innerHTML = "";
          const [file] = event.target.files;

          if (file) {
            if (file.type.startsWith("image/")) {
              currentMediaDiv.innerHTML = `<img src="" alt="Post Image" style="max-width: 40%;"  class="img-fluid mb-2 preview_image_post">`;

              document.querySelector(".preview_image_post").src =
                URL.createObjectURL(file);
              document.querySelector(".preview_image_post").style.display =
                "block";

              saveButton.removeAttribute("disabled");
            } else if (file.type.startsWith("video/")) {
              currentMediaDiv.innerHTML = `
              <video controls class="img-fluid">
                <source src="" type="video/mp4" class="preview_video_post">
                Your browser does not support the video tag.
              </video>`;

              document.querySelector(".preview_video_post").src =
                URL.createObjectURL(file);
              document.querySelector(".preview_video_post").style.display =
                "block";

              saveButton.removeAttribute("disabled");
            } else {
              saveButton.setAttribute("disabled", "true");
            }
          } else {
            saveButton.setAttribute("disabled", "true");
          }
        });
    },
    function (xhr) {
      if (
        xhr.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() => EditPostJsFIle(postId)); // Retry after refreshing token
      }
    }
  );
}

editButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const postId = this.getAttribute("data-postid");

    EditPostJsFIle(postId);
  });
});

function sendRequestInUtilityInCrudBecauseFormData(
  url,
  method,
  data,
  successCallback,
  errorCallback
) {
  $.ajax({
    type: method,
    url: `${location.protocol}//${location.host}${url}`,
    headers: {
      "X-CSRFToken": csrftoken,
    },
    data: method === "GET" ? null : data,
    processData: false,
    contentType: false,
    credentials: "include",
    success: successCallback,
    error: errorCallback,
  });
}

function updatePostRequest(data, postId, parentEl) {
  sendRequestInUtilityInCrudBecauseFormData(
    `/posts/${postId}/edit/`,
    "PATCH",
    data,
    function (response) {
      console.log(response);

      if (
        response.detail ==
        "Authentication credentials were not provided or are invalid."
      ) {
        refreshTokenAndRetryInUtility(() =>
          updatePostRequest(data, postId, parentEl)
        );
      } else if (
        (response.errors.video =
          "Video file is too large. Maximum size allowed is 10MB.")
      ) {
        document.querySelector(".magariAlteri").classList.add("show");
        document.querySelector(".magariAlteri").classList.remove("hide");
        document.querySelector(".magariAlteri").style.zIndex = 123123;

        let alert234 = document.querySelector(".alert-success");
        alert234.style.display = "none";
      }

      if (response.success) {
        editPostModal.hide();

        let alert234 = document.querySelector(".alert-success");
        alert234.style.display = "none";

        let media_type2 = response.data.media_type;
        let textEdit = response.data.text;
        let tagsArr = response.data.tags;

        if (media_type2 == "image") {
          let imageAfterEdit = parentEl.querySelector(".post_media_file");
          imageAfterEdit.src = "/static" + response.data.media;
        } else if (media_type2 == "video") {
          let videoAfterEdit = parentEl.querySelector(".video_post_source");

          videoAfterEdit.src = "/static" + response.data.media;
        }

        let postTextAfterEdit = parentEl.querySelector(".post_text_edit_for");

        postTextAfterEdit.textContent = textEdit;

        let tags = parentEl.querySelector(".tags");
        tags.innerHTML = "";
        tagsArr.forEach((tag) => {
          tags.innerHTML += `
          <span class="tag">#${tag}</span>
          `;
        });
      }
    },
    function (xhr) {
      if (
        xhr.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() =>
          updatePostRequest(data, postId, parentEl)
        );
      }

      alert(xhr.responseJSON?.detail);
    }
  );
}

if (window.location.href != location_window) {
  document
    .querySelector(".edit_post_save_button_modal")
    .addEventListener("click", (event) => {
      const postId = document.getElementById("editPostId").value;
      const form2 = document.getElementById("editPostForm");
      const formData = new FormData(form2);

      let data32 = {
        text: formData.get("text"),
        media: formData.get("media"),
        tags: formData.getAll("tags"),
      };

      const parentEl = document
        .querySelector(`[data-postid="${postId}"]`)
        .closest(".feed-posts");

      updatePostRequest(formData, postId, parentEl);

      let alert234 = document.querySelector(".alert-success");
      alert234.textContent = "Please Wait...";
      alert234.style.display = "block";
    });
}
