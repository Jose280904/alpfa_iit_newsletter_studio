/* ============================================================
   ALPFA IIT NEWSLETTER STUDIO
   ADMIN AUTHENTICATION
   ============================================================

   This file controls:

   - Executive Board login
   - Show/hide password
   - Communication with Apps Script
   - Saving the temporary login session
   ============================================================ */

/* ============================================================
   1. BACKEND API
   ============================================================ */

const API_URL =
    "https://script.google.com/macros/s/AKfycbziql2bqL-_Ha_6s8jhIAtZc_Sb-kHSS8v50jBwp8JXwMtSnVR-0Z88V_FAujHdYPdnJA/exec";

/* ============================================================
   2. PAGE ELEMENTS
   ============================================================ */

const loginForm =
    document.getElementById("loginForm");
const usernameInput =
    document.getElementById("username");
const passwordInput =
    document.getElementById("password");
const passwordToggle =
    document.getElementById("passwordToggle");
const loginButton =
    document.getElementById("loginButton");
const loginMessage =
    document.getElementById("loginMessage");

/* ============================================================
   3. SHOW / HIDE PASSWORD
   ============================================================ */

passwordToggle.addEventListener("click", function () {

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordToggle.textContent = "Hide";
        passwordToggle.setAttribute(
            "aria-label",
            "Hide password"
        );
    } else {
        passwordInput.type = "password";
        passwordToggle.textContent = "Show";
        passwordToggle.setAttribute(
            "aria-label",
            "Show password"
        );
    }
});

/* ============================================================
   4. LOGIN FORM
   ============================================================ */

loginForm.addEventListener(
    "submit",
    handleLogin
);

/* ============================================================
   5. HANDLE LOGIN
   ============================================================ */

async function handleLogin(event) {

    // Prevent normal page refresh.
    event.preventDefault();

    /* --------------------------------------------------------
       GET LOGIN INFORMATION
       -------------------------------------------------------- */

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    if (!username || !password) {
        showLoginMessage(
            "Please enter your username and password.",
            "error"
        );
        return;
    }

    /* --------------------------------------------------------
       UPDATE INTERFACE
       -------------------------------------------------------- */

    loginButton.disabled = true;
    loginButton.textContent =
        "Signing In...";
    showLoginMessage("", "");

    /* --------------------------------------------------------
       CREATE BACKEND REQUEST
       -------------------------------------------------------- */

    const requestData = {
        action: "login",
        username: username,
        password: password
    };

    /* --------------------------------------------------------
       SEND LOGIN REQUEST
       -------------------------------------------------------- */

    try {
        const response = await fetch(
            API_URL,
            {
                method: "POST",
                /*
                   text/plain avoids unnecessary CORS preflight
                   issues with Google Apps Script.
                */
                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },
                body:
                    JSON.stringify(requestData)
            }
        );

        const result =
            await response.json();

        /* ----------------------------------------------------
           SUCCESSFUL LOGIN
           ---------------------------------------------------- */

        if (result.success) {

            /*
               Save ONLY the temporary session token.

               We do NOT save the username/password.
            */

            sessionStorage.setItem(
                "alpfaAdminSession",
                result.sessionToken
            );

            showLoginMessage(
                "Login successful. Opening dashboard...",
                "success"
            );

            /*
               We haven't created dashboard.html yet.

               Once we do, this will send the user there.
            */

            setTimeout(function () {
                window.location.href =
                    "dashboard.html";
            }, 700);
        }

        /* ----------------------------------------------------
           INCORRECT LOGIN
           ---------------------------------------------------- */

        else {
            showLoginMessage(
                result.message ||
                "Incorrect username or password.",
                "error"
            );
        }
    }

    /* --------------------------------------------------------
       CONNECTION ERROR
       -------------------------------------------------------- */

    catch (error) {
        console.error(
            "Login error:",
            error
        );

        showLoginMessage(
            "Unable to connect to the login server.",
            "error"
        );
    }

    /* --------------------------------------------------------
       RESTORE BUTTON
       -------------------------------------------------------- */

    finally {
        loginButton.disabled = false;
        loginButton.textContent =
            "Log In";
    }
}

/* ============================================================
   6. LOGIN MESSAGE
   ============================================================ */

function showLoginMessage(message, type) {
    loginMessage.textContent =
        message;

    loginMessage.className =
        "form-message";

    if (type) {
        loginMessage.classList.add(type);
    }
}