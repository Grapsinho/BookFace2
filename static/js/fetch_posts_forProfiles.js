import { refreshTokenAndRetryInUtility } from "./utility.js";

const all_postLen = parseInt(document.getElementById("all_postLen").value);
let offset = 4;
const limit = 2;
let isLoading = false;
const loadingSpinner = document.getElementById("loading");
let lastScrollTop = 0;
let isScrollingDown = true;

let checkIfThereIsaPosts = true;

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

          console.log(data);

          const postsContainer = document.getElementById("profile-posts");

          data.posts.forEach((postHTML) => {
            postsContainer.insertAdjacentHTML("beforeend", postHTML);
          });
        } else {
          checkIfThereIsaPosts = false;
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

    if (checkIfThereIsaPosts) {
      loadMorePosts(email);
    }
  }
});
