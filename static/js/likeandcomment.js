import { refreshTokenAndRetryInUtility } from "./utility.js";

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
