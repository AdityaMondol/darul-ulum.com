document.addEventListener("DOMContentLoaded", () => {
    const stateManager = new StateManager();
    const auth = new Auth(stateManager);
    const DOM = getDomElements();

    initializeEventListeners();

    if (stateManager.getState("loggedInUser")) {
        updateProfileSection();
        DOMUtils.hideElement(DOM.loginSignupBtn);
        DOMUtils.showElement(DOM.profileSection);
    }

    function initializeEventListeners() {
        addEventListenerIfExists(DOM.loginForm, "submit", handleLogin);
        addEventListenerIfExists(DOM.cancelLoginBtn, "click", () => DOMUtils.toggleModal(DOM.loginModal, false));
        addEventListenerIfExists(DOM.loginSignupBtn, "click", () => DOMUtils.toggleModal(DOM.loginModal, true));
        addEventListenerIfExists(DOM.profilePicture, "click", toggleLogoutDropdown);
        addEventListenerIfExists(DOM.logoutBtn, "click", handleLogout);

        document.addEventListener("click", () => DOMUtils.hideElement(DOM.logoutDropdown));
        document.body.addEventListener("click", handleDeleteButtons);
    }

    async function handleLogin(event) {
        event.preventDefault();

        const formData = getFormData(["first-name", "last-name", "email", "password"]);
        const role = document.querySelector("input[name='role']:checked")?.value;
        const validationErrors = validateFormData(formData, role);

        if (Object.keys(validationErrors).length > 0) {
            DOMUtils.showInlineNotification(Object.values(validationErrors).join("\n"), "error");
            return;
        }

        const result = await auth.login(formData, role);

        if (result.success) {
            updateProfileSection();
            DOMUtils.toggleModal(DOM.loginModal, false);
            DOMUtils.hideElement(DOM.loginSignupBtn);
            DOMUtils.showElement(DOM.profileSection);
            showUserInitials(formData["first-name"]);
            DOMUtils.showInlineNotification(result.message, "success");
        } else {
            DOMUtils.showInlineNotification(result.message, "error");
        }
    }

    function handleLogout() {
        auth.logout();

        DOMUtils.hideElement(DOM.profileSection);
        DOMUtils.showElement(DOM.loginSignupBtn);
        DOMUtils.hideElement(DOM.userInitials);

        DOMUtils.showInlineNotification("You have been logged out.", "success");
    }

    function updateProfileSection() {
        const loggedInUser = stateManager.getState("loggedInUser");
        if (!loggedInUser) return;

        DOM.profilePicture.src = loggedInUser.profilePicture;
        DOM.userName.textContent = loggedInUser.name;
        DOM.userRole.textContent = loggedInUser.role;
        DOMUtils.showElement(DOM.profileSection);
    }

    function showUserInitials(firstName) {
        const initial = firstName.charAt(0).toUpperCase();
        Object.assign(DOM.userInitials.style, {
            display: "flex",
            backgroundColor: "#007bff",
            color: "#ffffff",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "20px",
            fontWeight: "bold",
        });
        DOM.userInitials.textContent = initial;
    }

    function handleNoticeSubmission(event) {
        event.preventDefault();
        const noticeContent = document.getElementById("notice-input")?.value.trim();

        if (!noticeContent) {
            DOMUtils.showInlineNotification("Notice content cannot be empty.", "error");
            return;
        }

        DOMUtils.showLoadingSpinner(true);

        const notice = {
            content: noticeContent,
            date: new Date().toLocaleString(),
            user: stateManager.getState("loggedInUser").name,
            id: uuid.v4(),
        };

        const existingNotices = stateManager.loadFromLocalStorage("notices") || [];
        existingNotices.push(notice);
        stateManager.saveToLocalStorage("notices", existingNotices);
        addNoticeToDOM(notice);
        DOMUtils.showLoadingSpinner(false);
        DOM.noticeForm.reset();
    }

    function handleCommentSubmission(event) {
        event.preventDefault();
        const commentContent = DOM.commentInput?.value.trim();

        if (!commentContent) {
            DOMUtils.showInlineNotification("Comment cannot be empty.", "error");
            return;
        }

        DOMUtils.showLoadingSpinner(true);

        const comment = {
            content: commentContent,
            date: new Date().toLocaleString(),
            user: stateManager.getState("loggedInUser").name,
            id: uuid.v4(),
        };

        const existingComments = stateManager.loadFromLocalStorage("comments") || [];
        existingComments.push(comment);
        stateManager.saveToLocalStorage("comments", existingComments);
        addCommentToDOM(comment);
        DOMUtils.showLoadingSpinner(false);
        DOM.commentInput.value = "";
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
});

// State Management Module
class StateManager {
    constructor() {
        this.state = {
            loggedInUser: null,
            googleUser: null,
        };
    }

    setState(key, value) {
        this.state[key] = value;
        if (key === "loggedInUser") {
            this.saveToLocalStorage("loggedInUser", value);
        }
    }

    getState(key) {
        return this.state[key];
    }

    loadState() {
        this.state.loggedInUser = this.loadFromLocalStorage("loggedInUser") || null;
    }

    loadFromLocalStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || null;
        } catch (error) {
            DOMUtils.showInlineNotification(`Failed to load data from localStorage: ${key}`, "error");
            return null;
        }
    }

    saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            DOMUtils.showInlineNotification(`Failed to save data to localStorage: ${key}`, "error");
        }
    }
}

// Authentication Module
class Auth {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    async login(formData, role) {
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                this.stateManager.setState("loggedInUser", {
                    name: `${formData["first-name"]} ${formData["last-name"]}`,
                    email: formData.email,
                    role,
                    profilePicture: this.stateManager.getState("googleUser")
                        ? this.stateManager.getState("googleUser").getBasicProfile().getImageUrl()
                        : "https://via.placeholder.com/100",
                });

                return { success: true, message: result.message };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Network error:', error);
            return { success: false, message: 'Failed to login. Please try again later.' };
        }
    }

    logout() {
        this.stateManager.setState("loggedInUser", null);
    }
}

// DOM Manipulation Module
class DOMUtils {
    static showElement(element) {
        if (element) element.style.display = "flex";
    }

    static hideElement(element) {
        if (element) element.style.display = "none";
    }

    static toggleModal(modal, show) {
        if (modal) {
            modal.style.display = show ? "block" : "none";
            document.body.classList.toggle("modal-open", show);
        }
    }

    static showLoadingSpinner(show) {
        if (DOM.loadingSpinner) {
            DOM.loadingSpinner.style.display = show ? "block" : "none";
        }
    }

    static showInlineNotification(message, type) {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="icon-${type}"></i> ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

function getDomElements() {
    return {
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
        userInitials: document.getElementById("user-initials"),
    };
}

function handleDeleteButtons(event) {
    if (event.target.classList.contains("delete-btn")) {
        const id = event.target.getAttribute("data-id");
        const type = event.target.closest("#noticeList") ? "notice" : "comment";
        if (type === "notice") deleteNotice(id);
        else deleteComment(id);
    }
}
