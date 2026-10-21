/* ============================================================
   ALPFA IIT NEWSLETTER STUDIO
   DASHBOARD JAVASCRIPT
   ============================================================

   This file controls:

   - Dashboard authentication
   - Session validation
   - Showing the dashboard after authentication
   - Logging out
   - Protecting the dashboard from unauthorized access

   Later, this file will also help load dashboard statistics.
   ============================================================ */

/* ============================================================
   1. BACKEND API
   ============================================================

   This is the same Google Apps Script Web App used by the
   subscription page and login page.
   ============================================================ */

const API_URL =
    "https://script.google.com/macros/s/AKfycbziql2bqL-_Ha_6s8jhIAtZc_Sb-kHSS8v50jBwp8JXwMtSnVR-0Z88V_FAujHdYPdnJA/exec";


/* ============================================================
   2. PAGE ELEMENTS
   ============================================================ */

const dashboardLoading =
    document.getElementById("dashboardLoading");
const dashboardApp =
    document.getElementById("dashboardApp");
const logoutButton =
    document.getElementById("logoutButton");

/* ============================================================
   DASHBOARD STATISTIC ELEMENTS
   ============================================================ */

const subscriberCount =
    document.getElementById("subscriberCount");

const newsletterCount =
    document.getElementById("newsletterCount");

const latestNewsletter =
    document.getElementById("latestNewsletter");

/* ============================================================
   3. CHECK LOGIN WHEN PAGE LOADS
   ============================================================

   As soon as dashboard.html loads, immediately verify that
   this browser has a valid Executive Board session.
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    validateSession
);

/* ============================================================
   4. VALIDATE ADMIN SESSION
   ============================================================ */

async function validateSession() {

    /* --------------------------------------------------------
       GET SESSION TOKEN
       --------------------------------------------------------

       auth.js saved this token after a successful login.

       sessionStorage means the token belongs to this browser
       tab/session rather than being permanently stored.
       -------------------------------------------------------- */

    const sessionToken =
        sessionStorage.getItem("alpfaAdminSession");

    /* --------------------------------------------------------
       NO TOKEN FOUND
       --------------------------------------------------------

       Someone may have manually typed:
       dashboard.html
       without logging in.
       Send them back to the login page.
       -------------------------------------------------------- */

    if (!sessionToken) {
        window.location.replace("login.html");
        return;
    }

    /* --------------------------------------------------------
       ASK APPS SCRIPT TO VERIFY THE TOKEN
       -------------------------------------------------------- */

    const requestData = {
        action: "validateSession",
        sessionToken: sessionToken
    };

    try {
        const response = await fetch(
            API_URL,
            {
                method: "POST",

                /*
                   We use text/plain because this worked with
                   our Apps Script deployment without causing
                   a browser CORS preflight problem.
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
           VALID SESSION
           ----------------------------------------------------

           Apps Script confirmed that this token belongs to an
           authenticated Executive Board session.
           ---------------------------------------------------- */

        if (
            result.success &&
            result.authenticated
        ) {
            showDashboard();
            return;
        }

        /* ----------------------------------------------------
           INVALID / EXPIRED SESSION
           ---------------------------------------------------- */

        logoutAndRedirect();
    }

    /* --------------------------------------------------------
       CONNECTION ERROR
       --------------------------------------------------------

       If the backend cannot be reached, we do NOT reveal the
       dashboard.

       Authentication should fail closed.
       -------------------------------------------------------- */

    catch (error) {
        console.error(
            "Session validation error:",
            error
        );

        /*
           Remove the token because we could not validate it.
        */

        sessionStorage.removeItem(
            "alpfaAdminSession"
        );

        /*
           Send the user back to login.
        */

        window.location.replace(
            "login.html"
        );
    }
}

/* ============================================================
   5. SHOW DASHBOARD
   ============================================================

   This function ONLY runs after Apps Script confirms that the
   session is valid.
   ============================================================ */

function showDashboard() {

    // Hide verification screen.
    dashboardLoading.style.display =
        "none";

    // Reveal the actual application.
    dashboardApp.hidden =
        false;

    /*
       Now that the user has been authenticated,
       load the protected dashboard statistics.
    */

    loadDashboardData();
}

/* ============================================================
   6. LOG OUT BUTTON
   ============================================================ */

logoutButton.addEventListener(
    "click",
    logoutAndRedirect
);

/* ============================================================
   7. LOG OUT AND RETURN TO LOGIN
   ============================================================ */

function logoutAndRedirect() {

    /*
       Remove the browser's copy of the session token.
    */

    sessionStorage.removeItem(
        "alpfaAdminSession"
    );

    /*
       Return to the login page.

       replace() is used instead of href so pressing the
       browser's Back button does not simply reopen the
       dashboard.
    */

    window.location.replace(
        "login.html"
    );
}

/* ============================================================
   8. LOAD DASHBOARD DATA
   ============================================================

   This function asks Apps Script for the latest dashboard
   information stored in Google Sheets.

   The session token is included with the request so the
   backend can verify that this is an authenticated admin.
   ============================================================ */

async function loadDashboardData() {

    /* --------------------------------------------------------
       GET CURRENT SESSION
       -------------------------------------------------------- */

    const sessionToken =
        sessionStorage.getItem("alpfaAdminSession");

    /*
       This normally shouldn't happen because validateSession()
       already checked for a token.

       Still, protected functions should never assume that a
       session exists.
    */

    if (!sessionToken) {
        logoutAndRedirect();
        return;
    }

    /* --------------------------------------------------------
       BUILD REQUEST
       -------------------------------------------------------- */

    const requestData = {
        action: "getDashboardData",
        sessionToken: sessionToken
    };

    /* --------------------------------------------------------
       REQUEST DASHBOARD INFORMATION
       -------------------------------------------------------- */

    try {
        const response = await fetch(
            API_URL,
            {
                method: "POST",
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
           SESSION NO LONGER VALID
           ----------------------------------------------------

           The session may have expired between loading the
           dashboard and requesting the statistics.
           ---------------------------------------------------- */

        if (
            !result.success ||
            !result.authenticated
        ) {
            logoutAndRedirect();
            return;
        }

        /* ----------------------------------------------------
           DISPLAY ACTIVE SUBSCRIBERS
           ---------------------------------------------------- */

        subscriberCount.textContent =
            result.activeSubscribers ?? 0;

        /* ----------------------------------------------------
           DISPLAY NEWSLETTERS SENT
           ---------------------------------------------------- */

        newsletterCount.textContent =
            result.newslettersSent ?? 0;

        /* ----------------------------------------------------
           DISPLAY LATEST NEWSLETTER
           ---------------------------------------------------- */

        latestNewsletter.textContent =
            result.latestNewsletter ||
            "None yet";

            // Update the Recent Newsletters section
const recentNewslettersSection =
    document.getElementById("recentNewsletters");

if (recentNewslettersSection) {

    if (result.newslettersSent > 0 && result.latestNewsletter) {

        // Remove empty-state styling when newsletters exist
        recentNewslettersSection.classList.remove("empty-state");

        recentNewslettersSection.innerHTML = `
            <div class="recent-newsletter-item">
                <h3>${result.latestNewsletter}</h3>
                <p>Successfully sent newsletter</p>
                <a href="newsletter-history.html">
                    View Newsletter History →
                </a>
            </div>
        `;

    } else {

        // Restore empty-state styling when no newsletters exist
        recentNewslettersSection.classList.add("empty-state");

        recentNewslettersSection.innerHTML = `
            <h3>No newsletters yet</h3>
            <p>
                Once you create and send your first newsletter,
                it will appear here.
            </p>
        `;

    }

}
    }

    /* --------------------------------------------------------
       ERROR LOADING DASHBOARD DATA
       -------------------------------------------------------- */

    catch (error) {
        console.error(
            "Dashboard data error:",
            error
        );

        /*
           We don't log the admin out for a statistics-loading
           error.

           Instead, show an error state in the cards.
        */

        subscriberCount.textContent =
            "Error";
        newsletterCount.textContent =
            "Error";
        latestNewsletter.textContent =
            "Unable to load";
    }
}