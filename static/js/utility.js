// ფუნქცია რომელიც გვეხმარება გავზავნოთ რექუესთი
export function sendRequestInUtility(
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
    data: method === "GET" ? null : JSON.stringify(data),
    contentType: "application/json",
    credentials: "include",
    success: successCallback,
    error: errorCallback,
  });
}

// ტოკენის რეფრეში
export function refreshTokenAndRetryInUtility(retryCallback) {
  sendRequestInUtility(
    "/auth/token/refresh/",
    "POST",
    {},
    function (data) {
      console.log("Token refreshed successfully", data);
      retryCallback(); // Retry original request after token refresh
    },
    function (error) {
      console.error("Token refresh failed", error);
      if (error.responseJSON?.message === "logout qeni") {
        window.location.href = `${location.protocol}//${location.host}/auth/logout/`;
      }
    }
  );
}
