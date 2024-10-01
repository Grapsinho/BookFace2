import { refreshTokenAndRetryInUtility } from "./utility.js";
import {
  toggleComment,
  toggleEditComment,
  toggleLike,
  deleteCommentJsFIle,
} from "./postActions1.js";

const all_postLen = parseInt(document.getElementById("all_postLen").value);
let offset = 4;
const limit = 2;
let isLoading = false;
const loadingSpinner = document.getElementById("loading");
let lastScrollTop = 0;
let isScrollingDown = true;

function sanitizeInput(userInput) {
  // Remove all HTML tags from user input
  let sanitizedInput = userInput.replace(/(<([^>]+)>)/gi, "");
  return sanitizedInput;
}

// Function to load more posts
function loadMorePosts(email) {
  if (isLoading) return;

  isLoading = true;
  loadingSpinner.style.display = "block"; // Show spinner

  // Make the AJAX request
  fetch(
    `/posts/${email}/fetch_posts_for_user/?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (
        data?.detail ===
        "Authentication credentials were not provided or are invalid."
      ) {
        refreshTokenAndRetryInUtility(() => loadMorePosts(email));
        window.location.reload();
      } else {
        if (data.posts && data.posts.length > 0) {
          offset += limit;

          const postsContainer = document.getElementById("profile-posts");

          data.posts.forEach((postHTML) => {
            postsContainer.insertAdjacentHTML("beforeend", postHTML);
          });

          const likeButtons = document.querySelectorAll(".addLikeOnPost");

          likeButtons.forEach((element) => {
            element.addEventListener("click", () => {
              if (element.dataset.shared_post) {
                toggleLike(element.dataset.post_id, element, "shared_post");
              } else {
                toggleLike(element.dataset.post_id, element, "post_post");
              }
            });
          });

          const commentButtons = document.querySelectorAll(".addCommentOnPost");

          commentButtons.forEach((element) => {
            element.addEventListener("click", () => {
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
            });
          });

          const delete_comment_btn = document.querySelectorAll(
            ".delete_comment--btn"
          );

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

          const edit_comment_btn =
            document.querySelectorAll(".edit_comment--btn");

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

          save_comment_edit_btn.forEach((element) => {
            element.addEventListener("click", () => {
              const commId = element.dataset.commentid;

              const comment_text =
                element.parentElement.parentElement.querySelector(
                  ".comment_text"
                );

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
        } else {
          // If no more posts, hide spinner
          loadingSpinner.style.display = "none";
        }

        isLoading = false;
        loadingSpinner.style.display = "none";
      }
    })
    .catch((error) => {
      console.error("Error loading posts:", error);

      isLoading = false;
      loadingSpinner.style.display = "none";
    });
}

function isNearBottom() {
  const scrollPosition = window.innerHeight + window.pageYOffset;
  const threshold = document.body.offsetHeight;
  return scrollPosition >= threshold;
}

window.addEventListener("scroll", () => {
  const currentScrollTop = window.pageYOffset;

  // Determine if the user is scrolling down
  isScrollingDown = currentScrollTop > lastScrollTop;
  lastScrollTop = currentScrollTop;

  // Only load more posts if scrolling down and near the bottom
  if (isScrollingDown && isNearBottom() && !isLoading && all_postLen > 4) {
    const url = window.location.href;
    const parts = url.split("/");
    const email = parts[parts.length - 1];

    loadMorePosts(email);
  }
});
