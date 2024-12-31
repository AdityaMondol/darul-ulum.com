document.addEventListener("DOMContentLoaded", () => {
  const stateManager = {
    state: {
      loggedInUser: null,
      googleUser: null,
    },
    setState(key, value) {
      this.state[key] = value;
      if (key === "loggedInUser") {
        this.saveToLocalStorage("loggedInUser", value);
      }
    },
    getState(key) {
      return this.state[key];
    },
    loadState() {
      this.state.loggedInUser = this.loadFromLocalStorage("loggedInUser") || null;
    },
    loadFromLocalStorage(key) {
      try {
        return JSON.parse(localStorage.getItem(key)) || null;
      } catch (error) {
        showInlineNotification(`Failed to load data from localStorage: ${key}`, "error");
        return null;
      }
    },
    saveToLocalStorage(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        showInlineNotification(`Failed to save data to localStorage: ${key}`, "error");
      }
    },
  };

  const DOM = {
    loginForm: document.getElementById("loginForm"),
    loginModal: document.getElementById("login-modal"),
    cancelLoginBtn: document.getElementById("cancelLogin"),
    profileSection: document.getElementById("profile-section"),
    profilePicture: document.getElementById("profile-picture"),
    userName: document.getElementById("user-name"),
    userRole: document.getElementById("user-role"),
    logoutBtn: document.getElementById("logout-btn"),
    logoutDropdown: document.getElementById("logout-dropdown"),
    loginSignupBtn: document.getElementById("login-signup-btn"),
    noticeForm: document.getElementById("noticeForm"),
    noticeList: document.getElementById("noticeList"),
    commentInput: document.getElementById("comment-input"),
    commentList: document.getElementById("comment-list"),
    addCommentBtn: document.getElementById("add-comment"),
    mediaUploadForm: document.getElementById("media-upload"),
    mediaGallery: document.getElementById("media-gallery"),
    loadingSpinner: document.getElementById("loading-spinner"),
  };

  function initializeEventListeners() {
    if (DOM.loginForm) DOM.loginForm.addEventListener("submit", handleLogin);

    if (DOM.cancelLoginBtn) {
      DOM.cancelLoginBtn.addEventListener("click", () => toggleModal(DOM.loginModal, false));
    }

    if (DOM.loginSignupBtn) {
      DOM.loginSignupBtn.addEventListener("click", () => toggleModal(DOM.loginModal, true));
    }

    if (DOM.profilePicture) {
      DOM.profilePicture.addEventListener("click", toggleLogoutDropdown);
    }

    if (DOM.logoutBtn) {
      DOM.logoutBtn.addEventListener("click", handleLogout);
    }

    document.addEventListener("click", () => hideElement(DOM.logoutDropdown));

    document.body.addEventListener("click", (event) => {
      if (event.target.classList.contains("delete-btn")) {
        const id = event.target.getAttribute("data-id");
        const type = event.target.closest("#noticeList") ? "notice" : "comment";
        if (type === "notice") deleteNotice(id);
        else deleteComment(id);
      }
    });
  }

  function handleLogin(event) {
    event.preventDefault();

    const formData = getFormData(["first-name", "last-name", "email", "password"]);
    const role = document.querySelector("input[name='role']:checked")?.value;

    const validationErrors = validateFormData(formData, role);

    if (Object.keys(validationErrors).length > 0) {
      showInlineNotification(Object.values(validationErrors).join("\n"), "error");
      return;
    }

    stateManager.setState("loggedInUser", {
      name: `${formData["first-name"]} ${formData["last-name"]}`,
      email: formData.email,
      role,
      profilePicture: stateManager.getState("googleUser")
        ? stateManager.getState("googleUser").getBasicProfile().getImageUrl()
        : "https://via.placeholder.com/100",
    });

    updateProfileSection();
    toggleModal(DOM.loginModal, false);
    hideElement(DOM.loginSignupBtn);
    showElement(DOM.profileSection);
  }

  function handleLogout() {
    stateManager.setState("loggedInUser", null);

    hideElement(DOM.profileSection);
    showElement(DOM.loginSignupBtn);

    showInlineNotification("You have been logged out.", "success");
  }

  function updateProfileSection() {
    if (!stateManager.getState("loggedInUser")) return;

    DOM.profilePicture.src = stateManager.getState("loggedInUser").profilePicture;
    DOM.userName.textContent = stateManager.getState("loggedInUser").name;
    DOM.userRole.textContent = stateManager.getState("loggedInUser").role;
    showElement(DOM.profileSection);
  }

  function handleNoticeSubmission() {
    if (!DOM.noticeForm) return;

    const existingNotices = stateManager.loadFromLocalStorage("notices") || [];
    existingNotices.forEach(addNoticeToDOM);

    DOM.noticeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const noticeContent = document.getElementById("notice-input")?.value.trim();

      if (!noticeContent) {
        showInlineNotification("Notice content cannot be empty.", "error");
        return;
      }

      showLoadingSpinner(true);

      const notice = {
        content: noticeContent,
        date: new Date().toLocaleString(),
        user: stateManager.getState("loggedInUser").name,
        id: uuid.v4(),
      };

      existingNotices.push(notice);
      stateManager.saveToLocalStorage("notices", existingNotices);
      addNoticeToDOM(notice);
      showLoadingSpinner(false);
      DOM.noticeForm.reset();
    });
  }

  function handleCommentSubmission() {
    const existingComments = stateManager.loadFromLocalStorage("comments") || [];
    existingComments.forEach(addCommentToDOM);

    DOM.addCommentBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      const commentContent = DOM.commentInput?.value.trim();

      if (!commentContent) {
        showInlineNotification("Comment cannot be empty.", "error");
        return;
      }

      showLoadingSpinner(true);

      const comment = {
        content: commentContent,
        date: new Date().toLocaleString(),
        user: stateManager.getState("loggedInUser").name,
        id: uuid.v4(),
      };

      existingComments.push(comment);
      stateManager.saveToLocalStorage("comments", existingComments);
      addCommentToDOM(comment);
      showLoadingSpinner(false);
      DOM.commentInput.value = "";
    });
  }

  function toggleModal(modal, show) {
    if (modal) {
      modal.style.display = show ? "block" : "none";
      document.body.classList.toggle("modal-open", show);
    }
  }

  function toggleLogoutDropdown() {
    DOM.logoutDropdown.style.display =
      DOM.logoutDropdown.style.display === "block" ? "none" : "block";
  }

  function addNoticeToDOM(notice) {
    const noticeItem = document.createElement("div");
    noticeItem.id = `notice-${notice.id}`;
    noticeItem.className = "notice-item";
    noticeItem.innerHTML = `
      <p>${notice.content}</p>
      <small>By ${notice.user} on ${notice.date}</small>
      <button class="delete-btn" data-id="notice-${notice.id}">Delete</button>
      <span class="notice-giver-name">${notice.user}</span>
    `;
    DOM.noticeList.appendChild(noticeItem);
  }

  function addCommentToDOM(comment) {
    const commentItem = document.createElement("li");
    commentItem.id = comment.id;
    commentItem.innerHTML = `
      <p>${comment.content}</p>
      <small>By ${comment.user} on ${comment.date}</small>
      <button class="delete-btn" data-id="${comment.id}">Delete</button>
    `;
    DOM.commentList.appendChild(commentItem);
  }

  function getFormData(fields) {
    return fields.reduce((data, fieldId) => {
      const field = document.getElementById(fieldId);
      data[fieldId] = field ? field.value.trim() : "";
      return data;
    }, {});
  }

  function validateFormData(formData, role) {
    const validationErrors = {};

    Object.keys(formData).forEach((field) => {
      if (formData[field] === "") {
        validationErrors[field] = `Please fill in the ${field.replace("-", " ")} field.`;
      }
    });

    if (!role) {
      validationErrors.role = "Please select a role.";
    }

    if (!validateEmail(formData.email)) {
      validationErrors.email = "Please enter a valid email address.";
    }

    if (!validatePassword(formData.password)) {
      validationErrors.password = "Password must be at least 8 characters long, contain at least one number, one uppercase and one lowercase letter.";
    }

    return validationErrors;
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  function validatePassword(password) {
    const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return re.test(String(password));
  }

  function showElement(element) {
    if (element) element.style.display = "flex";
  }

  function hideElement(element) {
    if (element) element.style.display = "none";
  }

  function deleteNotice(noticeId) {
    if (!confirm("Are you sure you want to delete this notice?")) return;

    const noticeElement = document.getElementById(`notice-${noticeId}`);
    if (noticeElement) {
      noticeElement.remove();
      const existingNotices = stateManager.loadFromLocalStorage("notices") || [];
      const updatedNotices = existingNotices.filter((item) => item.id !== noticeId);
      stateManager.saveToLocalStorage("notices", updatedNotices);
    }
  }

  function deleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const commentElement = document.getElementById(commentId);
    if (commentElement) {
      commentElement.remove();
      const existingComments = stateManager.loadFromLocalStorage("comments") || [];
      const updatedComments = existingComments.filter((item) => item.id !== commentId);
      stateManager.saveToLocalStorage("comments", updatedComments);
    }
  }

  function showLoadingSpinner(show) {
    if (DOM.loadingSpinner) {
      DOM.loadingSpinner.style.display = show ? "block" : "none";
    }
  }

  if (stateManager.getState("loggedInUser")) {
    updateProfileSection();
    hideElement(DOM.loginSignupBtn);
    showElement(DOM.profileSection);
  }

  initializeEventListeners();
});

// Utility function to show inline notifications
function showInlineNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `<i class="icon-${type}"></i> ${message}`;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
