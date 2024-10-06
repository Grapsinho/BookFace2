import { refreshTokenAndRetryInUtility } from "./utility.js";

function sanitizeInput(userInput) {
  // Remove all HTML tags from user input
  let sanitizedInput = userInput.replace(/(<([^>]+)>)/gi, "");
  return sanitizedInput;
}

const parentElementPostsForClick =
  document.getElementById("profile-posts") ??
  document.getElementById("news-feed");

export function toggleLike(postId, button, sharedOrNot) {
  $.ajax({
    url: `${location.protocol}//${location.host}/posts/${postId}/like/`,
    type: "POST",
    data: {
      "X-CSRFToken": csrftoken,
      "shared": sharedOrNot,
    },
    success: function (response) {
      console.log(response);
      let parentEl = button.parentElement;
      const like_countEl = parentEl.querySelector(".like_countNumber");
      let like_count = parseInt(
        parentEl.querySelector(".like_countNumber").textContent
      );

      if (response.message == "Liked") {
        like_count += 1;
        like_countEl.textContent = like_count;
        $(button).text("👎 Unlike");
      } else if (response.message_remove == "Like removed") {
        like_count -= 1;
        like_countEl.textContent = like_count;
        $(button).text("👍 Like");
      }
    },
    error: function (xhr) {
      if (
        xhr.responseJSON?.message ==
        "You have made too many login attempts. Please try again later."
      ) {
        let message2 =
          xhr.responseJSON.message + ` in ${xhr.responseJSON.available_in}`;

        document.querySelector(".alertText").textContent = message2;
        document.querySelector(".magariAlteri2").classList.add("show");
        document.querySelector(".magariAlteri2").classList.remove("hide");
        document.querySelector(".magariAlteri2").style.zIndex = 123123;
      }

      if (
        xhr.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() =>
          toggleLike(postId, button, sharedOrNot)
        );
      }
    },
  });
}

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("addLikeOnPost")) {
    const element = event.target;

    if (element.dataset.shared_post) {
      toggleLike(element.dataset.post_id, element, "shared_post");
    } else {
      toggleLike(element.dataset.post_id, element, "post_post");
    }
  }
});

export function toggleComment(postId, button, text, comment_cont, sharedOrNot) {
  $.ajax({
    url: `${location.protocol}//${location.host}/posts/${postId}/comments/`,
    type: "POST",
    data: {
      "X-CSRFToken": csrftoken,
      "text": text,
      "shared": sharedOrNot,
    },
    success: function (response) {
      if (comment_cont.querySelector(".noCommentPWashaleMere")) {
        comment_cont.querySelector(".noCommentPWashaleMere").remove();
      }

      $(comment_cont).prepend(`
        <div
            class="comment"
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
            "
          >
            <div style="margin: 0">
              <strong
                >${response.user}:</strong
              >
              <span class="comment_text">${text}</span>

              <div
                class="align-items-center div-for-update-btn gap-2"
                style="display: none"
              >
                <input
                  type="text"
                  class="form-control edit-comment-input"
                  value="${text}"
                  style="margin-top: 5px"
                />

                <button
                  class="btn save-comment-edit-btn"
                  style="background-color: #f9f9f900"
                  data-commentId="${response.comment_id}"
                >
                  ✔️
                </button>

                <button
                  class="btn save-comment-edit-btn-cancel"
                  style="background-color: #f9f9f900"
                >
                  ❌
                </button>
              </div>
            </div>
            <div class="three_dot_for_comment_edit_delete dropstart">
              <button
                class="dropdown-toggle"
                style="
                  color: rgb(0, 0, 0);
                  font-size: 1.4rem;
                  background: none;
                  border: none;
                  padding: 0 0.5rem 0 0;
                  margin: 0;
                "
                type="button"
                data-bs-toggle="dropdown"
              >
                ⋮
              </button>

              <ul class="dropdown-menu">
                <li
                  class="dropdown-item delete_comment--btn"
                  data-commentId="${response.comment_id}"
                  style="cursor: pointer"
                >
                  🗑️ Delete
                </li>
                <li
                  class="dropdown-item edit_comment--btn"
                  data-commentId="${response.comment_id}"
                  style="cursor: pointer"
                >
                  ✏️ Edit
                </li>
              </ul>
            </div>
          </div>
      `);

      const delete_comment_btn = document.querySelectorAll(
        ".delete_comment--btn"
      );

      // delete comment
      delete_comment_btn.forEach((element) => {
        element.addEventListener("click", () => {
          const commId = element.dataset.commentid;
          const parentElementCommentBtnDelete =
            element.parentElement.parentElement.parentElement;
          deleteCommentJsFIle(parentElementCommentBtnDelete, commId);

          document.querySelector(".alertText").textContent =
            "Comment Will Delete Soon...";
          document.querySelector(".magariAlteri2").classList.add("show");
          document.querySelector(".magariAlteri2").classList.remove("hide");
          document.querySelector(".magariAlteri2").style.zIndex = 123123;
        });
      });

      const edit_comment_btn = document.querySelectorAll(".edit_comment--btn");

      // open comment edit input
      edit_comment_btn.forEach((element) => {
        element.addEventListener("click", () => {
          const comment_text =
            (element.parentElement.parentElement.parentElement.querySelector(
              ".comment_text"
            ).style.display = "none");

          const div_for_update_btn =
            (element.parentElement.parentElement.parentElement.querySelector(
              ".div-for-update-btn"
            ).style.display = "flex");
        });
      });

      const save_comment_edit_btn = document.querySelectorAll(
        ".save-comment-edit-btn"
      );

      // edit comment
      save_comment_edit_btn.forEach((element) => {
        element.addEventListener("click", () => {
          const commId = element.dataset.commentid;

          const comment_text =
            element.parentElement.parentElement.querySelector(".comment_text");

          const div_for_update_btn = element.parentElement;

          const edit_comment_text =
            element.parentElement.parentElement.parentElement.querySelector(
              ".edit-comment-input"
            );

          if (sanitizeInput(edit_comment_text.value)) {
            toggleEditComment(
              commId,
              div_for_update_btn,
              sanitizeInput(edit_comment_text.value),
              comment_text
            );
          }
        });
      });

      const edit_comment_btn_cancel = document.querySelectorAll(
        ".save-comment-edit-btn-cancel"
      );

      // close comment edit
      edit_comment_btn_cancel.forEach((element) => {
        element.addEventListener("click", () => {
          const comment_text =
            (element.parentElement.parentElement.parentElement.querySelector(
              ".comment_text"
            ).style.display = "");

          const div_for_update_btn =
            (element.parentElement.parentElement.parentElement.querySelector(
              ".div-for-update-btn"
            ).style.display = "none");
        });
      });
    },
    error: function (xhr) {
      if (
        xhr.responseJSON?.message ==
        "You have made too many login attempts. Please try again later."
      ) {
        let message2 =
          xhr.responseJSON.message + ` in ${xhr.responseJSON.available_in}`;

        document.querySelector(".alertText").textContent = message2;
        document.querySelector(".magariAlteri2").classList.add("show");
        document.querySelector(".magariAlteri2").classList.remove("hide");
        document.querySelector(".magariAlteri2").style.zIndex = 123123;
      }

      if (
        xhr.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() =>
          toggleComment(postId, button, text, comment_cont, sharedOrNot)
        );
      }
    },
  });
}

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("addCommentOnPost")) {
    const element = event.target;

    const parentEl = element.parentElement;
    const commentInput = parentEl.querySelector(".comment_input");
    const comment_cont = parentEl.querySelector(".comments");

    if (
      element.dataset.shared_post &&
      sanitizeInput(commentInput.value.trim())
    ) {
      toggleComment(
        element.dataset.post_id,
        element,
        sanitizeInput(commentInput.value.trim()),
        comment_cont,
        "shared_post"
      );
    } else if (sanitizeInput(commentInput.value.trim())) {
      toggleComment(
        element.dataset.post_id,
        element,
        sanitizeInput(commentInput.value.trim()),
        comment_cont,
        "post_post"
      );
    }
  }
});

export function deleteCommentJsFIle(parentEl, comment_id) {
  $.ajax({
    url: `${location.protocol}//${location.host}/posts/${comment_id}/comments/delete/`,
    type: "DELETE",
    data: {
      "X-CSRFToken": csrftoken,
    },
    success: function (response) {
      if (response.status) {
        console.log(parentEl);
        parentEl.remove();

        document.querySelector(".magariAlteri2").classList.remove("show");
        document.querySelector(".magariAlteri2").classList.add("hide");
      }
    },
    error: function (xhr) {
      if (
        xhr.responseJSON.message ==
        "You have made too many login attempts. Please try again later."
      ) {
        let message2 =
          xhr.responseJSON.message + ` in ${xhr.responseJSON.available_in}`;

        document.querySelector(".alertText").textContent = message2;
        document.querySelector(".magariAlteri2").classList.add("show");
        document.querySelector(".magariAlteri2").classList.remove("hide");
        document.querySelector(".magariAlteri2").style.zIndex = 123123;
      }

      if (
        xhr.responseJSON.error ==
        "You have made too many login attempts. Please try again later."
      ) {
        alert(xhr.responseJSON.error);
      }

      if (
        xhr.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() =>
          deleteCommentJsFIle(parentEl, comment_id)
        );
      }
    },
  });
}

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("delete_comment--btn")) {
    const element = event.target;

    const commId = element.dataset.commentid;
    const parentElementCommentBtnDelete =
      element.parentElement.parentElement.parentElement;
    deleteCommentJsFIle(parentElementCommentBtnDelete, commId);

    document.querySelector(".alertText").textContent =
      "Comment Will Delete Soon...";
    document.querySelector(".magariAlteri2").classList.add("show");
    document.querySelector(".magariAlteri2").classList.remove("hide");
    document.querySelector(".magariAlteri2").style.zIndex = 123123;
  }
});

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("edit_comment--btn")) {
    const element = event.target;

    const comment_text =
      (element.parentElement.parentElement.parentElement.querySelector(
        ".comment_text"
      ).style.display = "none");

    const div_for_update_btn =
      (element.parentElement.parentElement.parentElement.querySelector(
        ".div-for-update-btn"
      ).style.display = "flex");
  }
});

export function toggleEditComment(commentId, edit_cont, text, comment_text) {
  $.ajax({
    url: `${location.protocol}//${location.host}/posts/${commentId}/comments/edit/`,
    type: "PATCH",
    data: {
      "X-CSRFToken": csrftoken,
      "text": text,
    },
    success: function (response) {
      if (response.status) {
        comment_text.textContent = text;
        comment_text.style.display = "";

        edit_cont.style.display = "none";
      }
    },
    error: function (xhr) {
      if (
        xhr.responseJSON.message ==
        "You have made too many login attempts. Please try again later."
      ) {
        let message2 =
          xhr.responseJSON.message + ` in ${xhr.responseJSON.available_in}`;

        document.querySelector(".alertText").textContent = message2;
        document.querySelector(".magariAlteri2").classList.add("show");
        document.querySelector(".magariAlteri2").classList.remove("hide");
        document.querySelector(".magariAlteri2").style.zIndex = 123123;
      }

      if (
        xhr.responseJSON.error ==
        "You have made too many login attempts. Please try again later."
      ) {
        alert(xhr.responseJSON.error);
      }

      if (
        xhr.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() =>
          toggleEditComment(commentId, edit_cont, text, comment_text)
        );
      }
    },
  });
}

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("save-comment-edit-btn")) {
    const element = event.target;

    const commId = element.dataset.commentid;

    const comment_text =
      element.parentElement.parentElement.querySelector(".comment_text");

    const div_for_update_btn = element.parentElement;

    const edit_comment_text =
      element.parentElement.parentElement.parentElement.querySelector(
        ".edit-comment-input"
      );

    if (sanitizeInput(edit_comment_text.value)) {
      toggleEditComment(
        commId,
        div_for_update_btn,
        sanitizeInput(edit_comment_text.value),
        comment_text
      );
    }
  }
});

parentElementPostsForClick.addEventListener("click", function (event) {
  if (event.target.classList.contains("save-comment-edit-btn-cancel")) {
    const element = event.target;

    const comment_text =
      (element.parentElement.parentElement.parentElement.querySelector(
        ".comment_text"
      ).style.display = "");

    const div_for_update_btn =
      (element.parentElement.parentElement.parentElement.querySelector(
        ".div-for-update-btn"
      ).style.display = "none");
  }
});
