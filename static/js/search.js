function sanitizeInput(userInput) {
  // Remove all HTML tags from user input
  let sanitizedInput = userInput.replace(/(<([^>]+)>)/gi, "");
  return sanitizedInput;
}

// Establish WebSocket connection
let socket = new WebSocket(`ws://${location.host}/ws/search_friends/`);

// Get search input elements and result containers for both desktop and mobile
const searchInputDesktop = document.getElementById("search-input__nav-desktop");
const searchInputMobile = document.getElementById("search-input__nav-mobile");
const resultsBoxDesktop = document.querySelector(
  "#search-friends-desktop .results-box"
);
const resultsBoxMobile = document.querySelector(
  "#search-friends-mobile .results-box"
);
const resultsListDesktop = document.querySelector(
  "#search-friends-desktop .results-list"
);
const resultsListMobile = document.querySelector(
  "#search-friends-mobile .results-list"
);

// Search function to handle search logic for both desktop and mobile
function handleSearch(input, resultsList, resultsBox, user_id) {
  const searchValue = input.value.toLowerCase(); // Normalize input to lowercase
  if (searchValue === "") {
    resultsBox.style.display = "none"; // Hide results if input is empty
    return;
  }

  // Send search query to WebSocket server
  const data = JSON.stringify({
    query: sanitizeInput(searchValue),
    user_id: user_id, // Sending the search input value as a query
  });
  socket.send(data);
}

// Handle incoming WebSocket messages (search results)
socket.onmessage = function (event) {
  const data = JSON.parse(event.data); // Parse incoming data
  const { results } = data;

  // Determine whether to update desktop or mobile results based on the active input
  const isDesktopSearch = document.activeElement === searchInputDesktop;
  const resultsList = isDesktopSearch ? resultsListDesktop : resultsListMobile;
  const resultsBox = isDesktopSearch ? resultsBoxDesktop : resultsBoxMobile;

  // Display filtered friends or a "No friends found" message
  if (results.length > 0) {
    resultsList.innerHTML = results
      .map(
        (friend) => `
          <div style="padding-inline: .5rem;">
            <a href="${location.protocol}//${location.host}/profile/${friend.email}" class="d-flex align-items-center gap-2" style="text-decoration: none; color: black;">
              <img src="/static/media/${friend.avatar}" style="width: 50px;" alt="">
              <li>${friend.first_name} ${friend.last_name}</li>
            </a>
          </div>
      `
      )
      .join(""); // Convert array to string
    resultsBox.style.display = "block"; // Show results box
  } else {
    resultsList.innerHTML = "<li>No friends found</li>"; // No results message
    resultsBox.style.display = "block"; // Show results box
  }
};

let timeout;
// Listen for input changes on desktop and mobile
searchInputDesktop.addEventListener("input", function () {
  const userId = searchInputDesktop.getAttribute("data-user_id");
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    handleSearch(
      searchInputDesktop,
      resultsListDesktop,
      resultsBoxDesktop,
      userId
    );
  }, 500);
});

searchInputMobile.addEventListener("input", function () {
  const userId = searchInputMobile.getAttribute("data-user_id");
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    handleSearch(
      searchInputMobile,
      resultsListMobile,
      resultsBoxMobile,
      userId
    );
  }, 500);
});

// Hide the results box when clicking outside of it (applies to both mobile and desktop)
document.addEventListener("click", function (e) {
  if (!document.getElementById("search-friends-desktop").contains(e.target)) {
    resultsBoxDesktop.style.display = "none";
  }
  if (!document.getElementById("search-friends-mobile").contains(e.target)) {
    resultsBoxMobile.style.display = "none";
  }
});

// Optional: Close WebSocket connection when leaving the page
window.onbeforeunload = function () {
  socket.close();
};
