// ფუნქცია რომელიც გვეხმარება გავზავნოთ რექუესთი
export function sendRequest(url, method, data, successCallback, errorCallback) {
  $.ajax({
    type: method,
    url: `${location.protocol}//${location.host}${url}`,
    headers: {
      "X-CSRFToken": csrftoken,
    },
    data: JSON.stringify(data),
    contentType: "application/json",
    credentials: "include",
    success: successCallback,
    error: errorCallback,
  });
}
