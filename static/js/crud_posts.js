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
          postBtn.disabled = true;

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

export function deletePostJsFIle(data, parentEl, timerId) {
  sendRequestInUtility(
    "/posts/deletePost/",
    "POST",
    data,
    function (response) {
      console.log(response);

      if (response.message == "Post deleted successfully") {
        parentEl.remove();
        document.querySelector(".alertText").textContent = "Post Deleted✅";
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

const parentElementPostsForClick =
  document.getElementById("profile-posts") ??
  document.getElementById("news-feed");

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("delete_post--btn")) {
    const element = event.target; // the clicked delete button
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

    document.querySelector(".alertText").textContent = "Post Deleting...";
    document.querySelector(".magariAlteri2").classList.add("show");
    document.querySelector(".magariAlteri2").classList.remove("hide");
    document.querySelector(".magariAlteri2").style.zIndex = 123123;

    deletePostJsFIle(data, parentEl);
  }
});

///////////////////////////////// edit post /////////////////////////////////////
let editPostModal;

editPostModal = new bootstrap.Modal(document.getElementById("editPostModal"));

function populateModalWithData(response) {
  // Set post text and ID
  document.getElementById("editPostText").value = response.data.text;
  document.getElementById("editPostId").value = response.data.id;

  let checkboxes_tag;

  if (document.querySelectorAll(".tag-checkbox23").length > 0) {
    checkboxes_tag = document.querySelectorAll(".tag-checkbox23");
  } else {
    checkboxes_tag = document.querySelectorAll(".tag-checkbox");
  }

  checkboxes_tag.forEach((element, idx) => {
    element.checked = false;

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
  let tagsWrapper = document.querySelector("#tags-wrapper");
  let fiveTag = false;

  let checkboxes_tag_class;

  if (document.querySelectorAll(".tag-checkbox23").length > 0) {
    checkboxes_tag_class = ".tag-checkbox23";
    tagsWrapper = document.querySelector("#tags-wrapper23");
  } else {
    checkboxes_tag_class = ".tag-checkbox";
  }

  // Get the current state of the text field and tags
  const isTextModified = editPostText.value.trim() !== originalText.trim();

  const selectedTags = Array.from(
    tagsWrapper.querySelectorAll(`${checkboxes_tag_class}:checked`)
  ).map((tag) => tag.dataset.name_tag.toLowerCase());

  if (
    tagsWrapper.querySelectorAll(`${checkboxes_tag_class}:checked`).length > 5
  ) {
    fiveTag = false;
  } else {
    fiveTag = true;
  }

  // Compare selected tags with original tags
  const isTagsModified =
    selectedTags.sort().join(",") !== originalTags.sort().join(",");

  // Enable the button if text or tags have changed
  const saveButton = document.querySelector(".edit_post_save_button_modal");
  if (isTextModified || isTagsModified) {
    saveButton.removeAttribute("disabled");

    if (fiveTag == false) {
      saveButton.setAttribute("disabled", "true");
    }
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

      let checkboxes_tag_class;

      if (document.querySelectorAll(".tag-checkbox23").length > 0) {
        checkboxes_tag_class = ".tag-checkbox23";
      } else {
        checkboxes_tag_class = ".tag-checkbox";
      }

      // Trigger validation on text and tag changes
      const editPostText = document.querySelector("#editPostText");
      const tagCheckboxes = document.querySelectorAll(
        `${checkboxes_tag_class}`
      );

      // Listen for text input changes
      editPostText.addEventListener("input", function () {
        validateForm(response.data.text, response.data.tags);
      });

      // Listen for tag checkbox changes
      tagCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", function (element) {
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

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("edit_post--btn")) {
    const element = event.target;

    const postId = element.getAttribute("data-postid");

    EditPostJsFIle(postId);
  }
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
      }

      if (response.errors) {
        if (
          response.errors.video ==
          "Video file is too large. Maximum size allowed is 10MB."
        ) {
          document.querySelector(".magariAlteri").classList.add("show");
          document.querySelector(".magariAlteri").classList.remove("hide");
          document.querySelector(".magariAlteri").style.zIndex = 123123;
        }
      }

      if (response.success) {
        editPostModal.hide();

        document.querySelector(".alertText").textContent = "Post Updated✅";
        document.querySelector(".magariAlteri2").classList.add("show");
        document.querySelector(".magariAlteri2").classList.remove("hide");
        document.querySelector(".magariAlteri2").style.zIndex = 123123;

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

    document.querySelector(".alertText").textContent = "Please Wait...";
    document.querySelector(".magariAlteri2").classList.add("show");
    document.querySelector(".magariAlteri2").classList.remove("hide");
    document.querySelector(".magariAlteri2").style.zIndex = 123123;
  });

////////////////////////// share post /////////////////////////////////////

const shareButtons = document.querySelectorAll(".share-btn");

function sanitizeInput(userInput) {
  // Remove all HTML tags from user input
  let sanitizedInput = userInput.replace(/(<([^>]+)>)/gi, "");
  return sanitizedInput;
}

function getOriginalPostForPreview(post_id) {
  $.ajax({
    type: "GET",
    url: `${location.protocol}//${location.host}/posts/${post_id}/getOriginalPost/`,
    headers: {
      "X-CSRFToken": csrftoken,
    },
    contentType: "application/json",
    credentials: "include",
    success: function (response) {
      if (response.success) {
        const post_cont = document.querySelector(".post-preview-for-share");

        const post = response.data;
        const author = post.author;
        const media_type = post.media_type;
        const media = post.media;
        const tags = post.tags.map((tag) => `#${tag}`).join(" ");

        // Prepare HTML by inserting dynamic data
        post_cont.innerHTML = `
          <article class="post feed-posts">
              <div class="post-header justify-content-between">
                  <div class="d-flex gap-2">
                        <img
                          src="/static${author.avatar}"
                          loading="lazy"
                          alt="User Avatar"
                          style="width: 50px;
                          height: 50px;
                          border-radius: 50%;"
                        />
                      <div class="post-user-info" style="font-size: .9rem;">
                          <h4>${author.first_name} ${author.last_name}</h4>
                          <p style="margin: 0;">Posted ${
                            post.created_at
                          } ago</p>
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
          </article>
        `;

        document.querySelector(".magariAlteri2").classList.remove("show");
        document.querySelector(".magariAlteri2").classList.add("hide");

        const confirm_share = document.querySelector("#confirm-share");

        confirm_share.setAttribute("data-post_id", post.id);

        confirm_share.addEventListener("click", () => {
          const post_id = confirm_share.getAttribute("data-post_id");
          const share_message = document.querySelector("#share-message").value;

          document.querySelector(".alertText").textContent = "Please Wait...";
          document.querySelector(".magariAlteri2").classList.add("show");
          document.querySelector(".magariAlteri2").classList.remove("hide");
          document.querySelector(".magariAlteri2").style.zIndex = 123123;

          createSharePost(sanitizeInput(share_message), post_id);
        });
      }
    },
    error: function (error) {
      if (
        error.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() => getOriginalPostForPreview(post_id));
      }
    },
  });
}

function createSharePost(message, post_id) {
  $.ajax({
    type: "POST",
    url: `${location.protocol}//${location.host}/posts/${post_id}/sharePost/`,
    headers: {
      "X-CSRFToken": csrftoken,
    },
    data: JSON.stringify(message),
    contentType: "application/json",
    credentials: "include",
    success: function (response) {
      console.log(response);
      if (response.status) {
        document.querySelector(".alertText").textContent =
          "Post Shared You Can See It In Your Profile.";
      }
    },
    error: function (error) {
      if (
        error.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() => createSharePost(message, post_id));
      } else {
        alert(error.responseJSON?.error);
      }
    },
  });
}

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("share-btn")) {
    const element = event.target;

    const postId = element.dataset.post_id;

    document.querySelector(".alertText").textContent = "Please Wait...";
    document.querySelector(".magariAlteri2").classList.add("show");
    document.querySelector(".magariAlteri2").classList.remove("hide");
    document.querySelector(".magariAlteri2").style.zIndex = 123123;

    getOriginalPostForPreview(postId);
  }
});

///////////////////////////////// delete shared post ////////////////////////////////////

function deleteSharedPostJsFIle(data, parentEl) {
  sendRequestInUtility(
    `/posts/${data}/delete/`,
    "DELETE",
    data,
    function (response) {
      console.log(response);

      if (response.status) {
        parentEl.remove();

        document.querySelector(".alertText").textContent =
          "Post Deleted successfully";
      }
    },
    function (xhr) {
      if (
        xhr.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() =>
          deleteSharedPostJsFIle(data, parentEl)
        );
      }
    }
  );
}

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("delete_sharedpost--btn")) {
    const element = event.target;

    const post_id = element.dataset.postid;
    const parentEl =
      element.parentElement.parentElement.parentElement.parentElement;

    document.querySelector(".alertText").textContent = "Please Wait...";
    document.querySelector(".magariAlteri2").classList.add("show");
    document.querySelector(".magariAlteri2").classList.remove("hide");
    document.querySelector(".magariAlteri2").style.zIndex = 123123;

    deleteSharedPostJsFIle(post_id, parentEl);
  }
});
