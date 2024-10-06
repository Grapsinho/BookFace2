import { refreshTokenAndRetryInUtility } from "./utility.js";

let offset = 8;
const limit = 8;
let isLoading = false;
const loadingSpinner = document.getElementById("loading");
let lastScrollTop = 0;
let isScrollingDown = true;

let checkIfThereIsaPosts = true;

// Function to load more posts
function loadMorePosts(email) {
  if (isLoading) return;

  isLoading = true;
  loadingSpinner.style.display = "block";

  fetch(
    `/posts/${email}/fetch_posts_for_feed/?limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
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

          const postsContainer = document.getElementById("news-feed");

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
  const threshold = document.body.offsetHeight - 150;
  return scrollPosition >= threshold;
}

window.addEventListener("scroll", () => {
  const currentScrollTop = window.pageYOffset;

  // Determine if the user is scrolling down
  isScrollingDown = currentScrollTop > lastScrollTop;
  lastScrollTop = currentScrollTop;

  // Only load more posts if scrolling down and near the bottom
  if (isScrollingDown && isNearBottom() && !isLoading) {
    const email = document.getElementById("user_email123").value;

    if (checkIfThereIsaPosts) {
      loadMorePosts(email);
    }
  }
});
