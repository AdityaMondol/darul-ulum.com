document.addEventListener("DOMContentLoaded", () => {
  const state = {
    loggedInUser: null,
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

    DOM.logoutDropdown?.addEventListener("click", (e) => e.stopPropagation());
  }

  function handleLogin(event) {
    event.preventDefault();

    const formData = getFormData(["first-name", "last-name", "email", "password"]);
    const role = document.querySelector("input[name='role']:checked")?.value;

    // Ensure the login form submission is handled correctly and provide feedback to the user
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

  function deleteItem(noticeId) {
    const noticeElement = document.getElementById(`notice-${noticeId}`);
    if (noticeElement) {
        noticeElement.remove(); // Remove the notice from the DOM
        // Optionally, also remove it from the data source if applicable
        // For example, update the notices array and re-render the list
        const existingNotices = loadFromLocalStorage("notices", []);
        const updatedNotices = existingNotices.filter(item => item.id !== noticeId.replace("notice-", ""));
        saveToLocalStorage("notices", updatedNotices);
    }
  }

  document.querySelectorAll('.notice .delete-btn').forEach(button => {
    button.addEventListener('click', function() {
        const noticeId = this.getAttribute('data-id');
        const noticeGiver = document.getElementById(`notice-${noticeId}`).querySelector('.notice-giver-name').textContent;
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')).name;

        // Debugging: Log the notice giver and logged-in user
        console.log('Notice Giver:', noticeGiver);
        console.log('Logged In User:', loggedInUser);

        if (noticeGiver !== loggedInUser) {
            alert('You cannot delete this notice. Only the notice giver can delete this notice.');
            return;
        }

        // Call deleteItem function to delete the notice
        deleteItem(noticeId);
    });
  });

  const noticeList = document.getElementById('noticeList');
  noticeList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const noticeId = e.target.getAttribute('data-id');
      // Call API to delete notice
      console.log(`Delete notice with id ${noticeId}`);
    }
  });

  const commentList = document.getElementById('comment-list');
  commentList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const commentId = e.target.getAttribute('data-id');
      // Call API to delete comment
      console.log(`Delete comment with id ${commentId}`);
    }
  });

  const mediaGallery = document.getElementById('media-gallery');
  mediaGallery.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const mediaId = e.target.getAttribute('data-id');
      // Call API to delete media item
      console.log(`Delete media item with id ${mediaId}`);
    }
  });

  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent the default form submission

      // Get input values
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      // Debugging: Log input values
      console.log('First Name:', firstName);
      console.log('Last Name:', lastName);
      console.log('Email:', email);
      console.log('Password:', password);

      // Alert to confirm form submission
      alert('Form submitted!');

      // Validate inputs
      if (firstName && lastName && email && password) {
        // Simulate a successful login
        alert('Login successful! Welcome, ' + firstName + ' ' + lastName + '!');

        // Update the UI to show the profile icon
        const profileIcon = document.createElement('div');
        profileIcon.className = 'profile-icon';
        profileIcon.style.backgroundColor = 'blue';
        profileIcon.style.color = 'white';
        profileIcon.style.borderRadius = '50%';
        profileIcon.style.width = '40px';
        profileIcon.style.height = '40px';
        profileIcon.style.display = 'flex';
        profileIcon.style.alignItems = 'center';
        profileIcon.style.justifyContent = 'center';
        profileIcon.innerText = firstName.charAt(0) + lastName.charAt(0);

        // Replace login/signup button with profile icon
        const loginSignupBtn = document.getElementById('login-signup-btn');
        if (loginSignupBtn) {
          loginSignupBtn.style.display = 'none';
          loginSignupBtn.parentNode.insertBefore(profileIcon, loginSignupBtn.nextSibling);
        }

        // Optionally, you can redirect to another page or update the UI
        // window.location.href = 'homepage.html'; // Example redirect
      } else {
        alert('Please fill in all required fields.');
      }
    });
  }

  // Add event listener for notice form submission
  const noticeForm = document.getElementById('noticeForm');
  if (noticeForm) {
    noticeForm.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent the default form submission

      const noticeContent = document.getElementById('notice-input').value;
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

      // Validate input
      if (noticeContent && loggedInUser) {
        const notice = {
          id: Date.now(),
          content: noticeContent,
          user: loggedInUser.name,
          date: new Date().toLocaleString(),
        };

        // Save notice to local storage
        const existingNotices = loadFromLocalStorage('notices', []);
        existingNotices.push(notice);
        saveToLocalStorage('notices', existingNotices);

        // Update the UI to display the new notice
        addNoticeToDOM(notice);
        noticeForm.reset(); // Clear the input field after submission
      } else {
        alert('Please enter a notice.');
      }
    });
  }

  // Add event listener for comment form submission
  const commentForm = document.getElementById('commentForm');
  if (commentForm) {
    commentForm.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent the default form submission

      const commentContent = document.getElementById('comment-input').value;
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

      // Validate input
      if (commentContent && loggedInUser) {
        const comment = {
          id: Date.now(),
          content: commentContent,
          user: loggedInUser.name,
          date: new Date().toLocaleString(),
        };

        // Save comment to local storage
        const existingComments = loadFromLocalStorage('comments', []);
        existingComments.push(comment);
        saveToLocalStorage('comments', existingComments);

        // Update the UI to display the new comment
        addCommentToDOM(comment);
        commentForm.reset(); // Clear the input field after submission
      } else {
        alert('Please enter a comment.');
      }
    });
  }

  // Add event listener for media upload
  const mediaForm = document.getElementById('mediaForm');
  if (mediaForm) {
    mediaForm.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent the default form submission

      const mediaInput = document.getElementById('media-upload');
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

      // Validate input
      if (mediaInput.files.length > 0 && loggedInUser) {
        const mediaFile = mediaInput.files[0];
        const media = {
          id: Date.now(),
          url: URL.createObjectURL(mediaFile),
          user: loggedInUser.name,
          date: new Date().toLocaleString(),
        };

        // Save media to local storage
        const existingMedia = loadFromLocalStorage('media', []);
        existingMedia.push(media);
        saveToLocalStorage('media', existingMedia);

        // Update the UI to display the new media
        addMediaToDOM(media);
        mediaForm.reset(); // Clear the input field after submission
      } else {
        alert('Please upload a media file.');
      }
    });
  }

  // Make the login permanent
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('userLoggedIn', 'true');
  });

  initializeEventListeners();
});
