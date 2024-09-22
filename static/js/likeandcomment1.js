import { refreshTokenAndRetryInUtility } from "./utility.js";

function sanitizeInput(userInput) {
  // Remove all HTML tags from user input
  let sanitizedInput = userInput.replace(/(<([^>]+)>)/gi, "");
  return sanitizedInput;
}

function toggleLike(postId, button) {
  $.ajax({
    url: `${location.protocol}//${location.host}/posts/${postId}/like/`,
    type: "POST",
    data: {
      "X-CSRFToken": csrftoken,
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
        xhr.responseJSON?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        // ვარეფრეშებთ ტოკენს
        refreshTokenAndRetryInUtility(() => toggleLike(postId, button));
      }
    },
  });
}

const likeButtons = document.querySelectorAll(".addLikeOnPost");

likeButtons.forEach((element) => {
  element.addEventListener("click", () => {
    toggleLike(element.dataset.post_id, element);
  });
});

export function toggleComment(postId, button, text, comment_cont) {
  $.ajax({
    url: `${location.protocol}//${location.host}/posts/${postId}/comments/`,
    type: "POST",
    data: {
      "X-CSRFToken": csrftoken,
      "text": text,
    },
    success: function (response) {
      if (comment_cont.querySelector(".noCommentPWashaleMere")) {
        comment_cont.querySelector(".noCommentPWashaleMere").remove();
      }

      $(comment_cont).prepend(`
        <div class="comment">
          <p><strong>${response.user}:</strong> ${text}</p>
        </div>
      `);
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
          toggleComment(postId, button, text, comment_cont)
        );
      }
    },
  });
}

const commentButtons = document.querySelectorAll(".addCommentOnPost");

commentButtons.forEach((element) => {
  element.addEventListener("click", () => {
    const parentEl = element.parentElement;
    const commentInput = parentEl.querySelector(".comment_input");
    const comment_cont = parentEl.querySelector(".comments");

    if (sanitizeInput(commentInput.value.trim())) {
      toggleComment(
        element.dataset.post_id,
        element,
        sanitizeInput(commentInput.value.trim()),
        comment_cont
      );
    }
  });
});

const delete_comment_btn = document.querySelectorAll(".delete_comment--btn");

function deleteCommentJsFIle(parentEl, comment_id) {
  $.ajax({
    url: `${location.protocol}//${location.host}/posts/${comment_id}/comments/delete/`,
    type: "DELETE",
    data: {
      "X-CSRFToken": csrftoken,
    },
    success: function (response) {
      if (response.status) {
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

function toggleEditComment(commentId, edit_cont, text, comment_text) {
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

const save_comment_edit_btn = document.querySelectorAll(
  ".save-comment-edit-btn"
);

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
