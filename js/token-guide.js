(function () {
  "use strict";

  var ADMIN_AUTH_KEY = "pm_subdomains_admin_auth";

  function storageGet(storageName, key) {
    try {
      var store = window[storageName];
      if (store) return store.getItem(key) || "";
    } catch (error) {
      return "";
    }
    return "";
  }

  function isAuthed() {
    return storageGet("sessionStorage", ADMIN_AUTH_KEY) === "1" || storageGet("localStorage", ADMIN_AUTH_KEY) === "1";
  }

  var guideRoot = document.getElementById("guide-root");
  var loginRequired = document.getElementById("guide-login-required");

  if (isAuthed()) {
    guideRoot.hidden = false;
    loginRequired.hidden = true;
  } else {
    document.body.classList.add("locked");
    guideRoot.hidden = true;
    loginRequired.hidden = false;
  }
})();
