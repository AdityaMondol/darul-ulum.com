document.addEventListener("DOMContentLoaded", () => {
  const state = {
    loggedInUser: JSON.parse(localStorage.getItem("loggedInUser")) || null,
    googleUser: null,
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
  };

  function initializeEventListeners() {
    if (DOM.loginForm) {
      console.log("Login form found, attaching event listener.");
      DOM.loginForm.addEventListener("submit", handleLogin);
    }

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

    DOM.logoutDropdown?.addEventListener("click", (e) => e.stopPropagation());
  }

  function handleLogin(event) {
    event.preventDefault();
    console.log("Login form submitted.");

    const formData = getFormData(["first-name", "last-name", "email", "password"]);
    console.log("Form Data:", formData);
    const role = document.querySelector("input[name='role']:checked")?.value;
    console.log("Selected Role:", role);

    const validationErrors = {};
    Object.keys(formData).forEach((field) => {
      if (formData[field] === "") {
        validationErrors[field] = `Please fill in the ${field.replace("-", " ")} field.`;
      }
    });
    if (!role) {
      validationErrors.role = "Please select a role.";
    }

    if (Object.keys(validationErrors).length > 0) {
      alert(Object.values(validationErrors).join("\n"));
      return;
    }

    state.loggedInUser = {
      name: `${formData["first-name"]} ${formData["last-name"]}`,
      email: formData.email,
      role,
      profilePicture: state.googleUser
        ? state.googleUser.getBasicProfile().getImageUrl()
        : "https://via.placeholder.com/100",
    };

    updateProfileSection();
    toggleModal(DOM.loginModal, false);
    hideElement(DOM.loginSignupBtn);
    showElement(DOM.profileSection);

    localStorage.setItem("loggedInUser", JSON.stringify(state.loggedInUser));
  }

  function handleLogout() {
    state.loggedInUser = null;
    localStorage.removeItem("loggedInUser");

    hideElement(DOM.profileSection);
    showElement(DOM.loginSignupBtn);

    alert("You have been logged out.");
  }

  function updateProfileSection() {
    if (!state.loggedInUser) return;

    DOM.profilePicture.src = state.loggedInUser.profilePicture;
    DOM.userName.textContent = state.loggedInUser.name;
    DOM.userRole.textContent = state.loggedInUser.role;
    showElement(DOM.profileSection);
  }

  function handleNoticeSubmission() {
    if (!DOM.noticeForm) return;

    const existingNotices = loadFromLocalStorage("notices", []);
    existingNotices.forEach(addNoticeToDOM);

    DOM.noticeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const noticeContent = document.getElementById("notice-input")?.value.trim();

      if (!noticeContent) {
        alert("Notice content cannot be empty.");
        return;
      }

      const notice = {
        content: noticeContent,
        date: new Date().toLocaleString(),
        user: state.loggedInUser.name,
        id: Math.random().toString(36).substr(2, 9),
      };

      existingNotices.push(notice);
      saveToLocalStorage("notices", existingNotices);
      addNoticeToDOM(notice);
      DOM.noticeForm.reset();
    });
  }

  function handleCommentSubmission() {
    const existingComments = loadFromLocalStorage("comments", []);
    existingComments.forEach(addCommentToDOM);

    DOM.addCommentBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      const commentContent = DOM.commentInput?.value.trim();

      if (!commentContent) {
        alert("Comment cannot be empty.");
        return;
      }

      const comment = {
        content: commentContent,
        date: new Date().toLocaleString(),
        user: state.loggedInUser.name,
        id: Math.random().toString(36).substr(2, 9),
      };

      existingComments.push(comment);
      saveToLocalStorage("comments", existingComments);
      addCommentToDOM(comment);
      DOM.commentInput.value = "";
    });
  }

  function toggleModal(modal, show) {
    if (modal) {
      modal.style.display = show ? "block" : "none";
      document.body.style.overflow = show ? "hidden" : "auto";
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

    const deleteBtn = noticeItem.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => deleteNotice(notice.id));
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

    const deleteBtn = commentItem.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => deleteComment(comment.id));
  }

  function getFormData(fields) {
    return fields.reduce((data, fieldId) => {
      const field = document.getElementById(fieldId);
      data[fieldId] = field ? field.value.trim() : "";
      return data;
    }, {});
  }

  function loadFromLocalStorage(key, defaultValue) {
    return JSON.parse(localStorage.getItem(key)) || defaultValue;
  }

  function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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
      const existingNotices = loadFromLocalStorage("notices", []);
      const updatedNotices = existingNotices.filter((item) => item.id !== noticeId);
      saveToLocalStorage("notices", updatedNotices);
    }
  }

  function deleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const commentElement = document.getElementById(commentId);
    if (commentElement) {
      commentElement.remove();
      const existingComments = loadFromLocalStorage("comments", []);
      const updatedComments = existingComments.filter((item) => item.id !== commentId);
      saveToLocalStorage("comments", updatedComments);
    }
  }

  if (state.loggedInUser) {
    updateProfileSection();
    hideElement(DOM.loginSignupBtn);
    showElement(DOM.profileSection);
  }

  initializeEventListeners();
});
