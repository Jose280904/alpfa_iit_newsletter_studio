/* ============================================================
   ALPFA IIT NEWSLETTER STUDIO
   Newsletter History
   ============================================================ */


/* ============================================================
   1. APPS SCRIPT API
   ============================================================ */

const API_URL =
    "https://script.google.com/macros/s/AKfycbziql2bqL-_Ha_6s8jhIAtZc_Sb-kHSS8v50jBwp8JXwMtSnVR-0Z88V_FAujHdYPdnJA/exec";


/* ============================================================
   2. PAGE ELEMENTS
   ============================================================ */

const historyLoading =
    document.getElementById("historyLoading");

const historyApp =
    document.getElementById("historyApp");

const logoutButton =
    document.getElementById("logoutButton");

const historyCount =
    document.getElementById("historyCount");

const historyListLoading =
    document.getElementById("historyListLoading");

const historyEmpty =
    document.getElementById("historyEmpty");

const historyTableContainer =
    document.getElementById("historyTableContainer");

const historyTableBody =
    document.getElementById("historyTableBody");

const historyMessage =
    document.getElementById("historyMessage");

const filterButtons =
    document.querySelectorAll(".history-filter");


/*
   Stores the newsletters returned by Google Sheets.

   Filtering will happen using this array instead of making
   another API request every time the user clicks a filter.
*/

let newsletterHistory = [];


/*
   Keeps track of the currently selected filter.
*/

let currentFilter = "all";


/* ============================================================
   3. START PAGE
   ============================================================ */

validateSession();


/* ============================================================
   4. VALIDATE ADMIN SESSION
   ============================================================ */

async function validateSession() {

    const sessionToken =
        sessionStorage.getItem("alpfaAdminSession");


    /*
       No session token means the user should not be allowed
       to view this page.
    */

    if (!sessionToken) {

        window.location.replace("login.html");

        return;

    }


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
                    JSON.stringify({

                        action:
                            "validateSession",

                        sessionToken:
                            sessionToken

                    })

            }

        );


        const result =
            await response.json();


        if (
            result.success &&
            result.authenticated
        ) {

            showHistoryPage();

            return;

        }


        logoutAndRedirect();

    }

    catch (error) {

        console.error(
            "Session validation error:",
            error
        );


        logoutAndRedirect();

    }

}


/* ============================================================
   5. SHOW HISTORY PAGE
   ============================================================ */

function showHistoryPage() {

    historyLoading.hidden =
        true;


    historyApp.hidden =
        false;


    /*
       Once access is verified, retrieve the newsletters.
    */

    loadNewsletterHistory();

}


/* ============================================================
   6. LOAD NEWSLETTER HISTORY
   ============================================================ */

async function loadNewsletterHistory() {

    const sessionToken =
        sessionStorage.getItem("alpfaAdminSession");


    if (!sessionToken) {

        logoutAndRedirect();

        return;

    }


    /*
       Show the loading state while Google Sheets is being read.
    */

    historyListLoading.hidden =
        false;


    historyEmpty.hidden =
        true;


    historyTableContainer.hidden =
        true;


    historyMessage.textContent =
        "";


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
                    JSON.stringify({

                        action:
                            "getNewsletterHistory",

                        sessionToken:
                            sessionToken

                    })

            }

        );


        const result =
            await response.json();


        /* ----------------------------------------------------
           SESSION EXPIRED
           ---------------------------------------------------- */

        if (
            result.authenticated === false
        ) {

            logoutAndRedirect();

            return;

        }


        /* ----------------------------------------------------
           BACKEND ERROR
           ---------------------------------------------------- */

        if (!result.success) {

            historyListLoading.hidden =
                true;


            showHistoryMessage(
                result.message ||
                "Unable to load newsletter history.",
                "error"
            );


            return;

        }


        /* ----------------------------------------------------
           STORE NEWSLETTER DATA
           ---------------------------------------------------- */

        newsletterHistory =
            Array.isArray(result.newsletters)
                ? result.newsletters
                : [];


        /*
           Display the total number of newsletters.
        */

        updateHistoryCount();


        /*
           Render using the currently selected filter.
        */

        renderNewsletterHistory();

    }

    catch (error) {

        console.error(
            "Newsletter history error:",
            error
        );


        historyListLoading.hidden =
            true;


        showHistoryMessage(
            "Unable to load newsletter history. Please try again.",
            "error"
        );

    }

}


/* ============================================================
   7. UPDATE NEWSLETTER COUNT
   ============================================================ */

function updateHistoryCount() {

    const count =
        newsletterHistory.length;


    if (count === 1) {

        historyCount.textContent =
            "1 newsletter";

    }

    else {

        historyCount.textContent =
            count + " newsletters";

    }

}


/* ============================================================
   8. RENDER NEWSLETTER HISTORY
   ============================================================ */

function renderNewsletterHistory() {


    /*
       Remove any previously displayed rows.
    */

    historyTableBody.innerHTML =
        "";


    historyListLoading.hidden =
        true;


    /*
       Filter newsletters depending on the selected tab.
    */

    const filteredNewsletters =
        newsletterHistory.filter(
            function (newsletter) {

                if (currentFilter === "all") {

                    return true;

                }


                return (
                    String(newsletter.status)
                        .toLowerCase() ===
                    currentFilter
                );

            }
        );


    /* --------------------------------------------------------
       EMPTY STATE
       -------------------------------------------------------- */

    if (filteredNewsletters.length === 0) {

        historyTableContainer.hidden =
            true;


        historyEmpty.hidden =
            false;


        return;

    }


    /* --------------------------------------------------------
       DISPLAY TABLE
       -------------------------------------------------------- */

    historyEmpty.hidden =
        true;


    historyTableContainer.hidden =
        false;


    /*
       Create one table row for each newsletter.
    */

    filteredNewsletters.forEach(
        function (newsletter) {

            const row =
                createNewsletterRow(newsletter);


            historyTableBody.appendChild(row);

        }
    );

}


/* ============================================================
   9. CREATE NEWSLETTER TABLE ROW
   ============================================================ */

function createNewsletterRow(newsletter) {

    const row =
        document.createElement("tr");


    /*
       Determine whether this newsletter is a draft or sent.
    */

    const status =
        String(newsletter.status || "")
            .toLowerCase();


    /* --------------------------------------------------------
       NEWSLETTER INFORMATION
       -------------------------------------------------------- */

    const newsletterCell =
        document.createElement("td");


    const newsletterInfo =
        document.createElement("div");


    newsletterInfo.className =
        "history-newsletter-info";


    const newsletterTitle =
        document.createElement("strong");


    newsletterTitle.textContent =
        newsletter.title ||
        "Untitled Newsletter";


    const newsletterSubject =
        document.createElement("span");


    newsletterSubject.textContent =
        newsletter.subject ||
        "No email subject";


    newsletterInfo.appendChild(
        newsletterTitle
    );


    newsletterInfo.appendChild(
        newsletterSubject
    );


    newsletterCell.appendChild(
        newsletterInfo
    );


    /* --------------------------------------------------------
       STATUS
       -------------------------------------------------------- */

    const statusCell =
        document.createElement("td");


    const statusBadge =
        document.createElement("span");


    statusBadge.className =
        "history-status " +
        (
            status === "sent"
                ? "sent"
                : "draft"
        );


    statusBadge.textContent =
        newsletter.status ||
        "Draft";


    statusCell.appendChild(
        statusBadge
    );


    /* --------------------------------------------------------
       CREATED DATE
       -------------------------------------------------------- */

    const createdCell =
        document.createElement("td");


    createdCell.textContent =
        formatNewsletterDate(
            newsletter.dateCreated
        );


    /* --------------------------------------------------------
       SENT DATE
       -------------------------------------------------------- */

    const sentCell =
        document.createElement("td");


    if (newsletter.dateSent) {

        sentCell.textContent =
            formatNewsletterDate(
                newsletter.dateSent
            );

    }

    else {
        sentCell.textContent =
            "—";

        sentCell.className =
            "history-muted";
    }

    /* --------------------------------------------------------
       RECIPIENTS
       -------------------------------------------------------- */

    const recipientsCell =
        document.createElement("td");

    if (
        newsletter.recipients !== "" &&
        newsletter.recipients !== null &&
        newsletter.recipients !== undefined
    ) {
        recipientsCell.textContent =
            newsletter.recipients;
    }
    else {
        recipientsCell.textContent =
            "—";

        recipientsCell.className =
            "history-muted";
    }

    /* --------------------------------------------------------
       ACTION BUTTON
       -------------------------------------------------------- */

    const actionCell =
        document.createElement("td");

    const actionLink =
        document.createElement("a");

    actionLink.className =
        "history-action-button";

    /*
       Draft newsletters will eventually reopen inside the
       newsletter builder.

       Sent newsletters will eventually open in read-only mode.
    */

    if (status === "draft") {
        actionLink.textContent =
            "Edit";

        actionLink.href =
            "create-newsletter.html?id=" +
            encodeURIComponent(
                newsletter.id
            );
    }
    else {
        actionLink.textContent =
            "View";

        /*
           We have not built the sent newsletter viewer yet,
           so this button is temporarily disabled.
        */

        actionLink.href =
            "#";

        actionLink.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                showHistoryMessage(
                    "Sent newsletter viewing will be added next.",
                    ""
                );
            }
        );
    }

    actionCell.appendChild(
        actionLink
    );

    if (status === "draft") {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete Draft";
        deleteButton.className = "history-action-button history-delete-button";
        deleteButton.style.marginLeft = "8px";
        deleteButton.style.color = "#b42318";
        deleteButton.style.cursor = "pointer";
        deleteButton.addEventListener("click", () => deleteNewsletterDraft(newsletter, deleteButton));
        actionCell.appendChild(deleteButton);
    }

    /* --------------------------------------------------------
       ADD CELLS TO ROW
       -------------------------------------------------------- */

    row.appendChild(
        newsletterCell
    );

    row.appendChild(
        statusCell
    );

    row.appendChild(
        createdCell
    );

    row.appendChild(
        sentCell
    );

    row.appendChild(
        recipientsCell
    );

    row.appendChild(
        actionCell
    );

    return row;
}

/* ============================================================
   10. FORMAT NEWSLETTER DATE
   ============================================================ */

function formatNewsletterDate(dateValue) {
    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    /*
       Example:

       Oct 7, 2026
    */

    return date.toLocaleDateString(
        "en-US",
        {
            month:
                "short",
            day:
                "numeric",
            year:
                "numeric"
        }
    );
}

/* ============================================================
   11. FILTER BUTTONS
   ============================================================ */

filterButtons.forEach(
    function (button) {
        button.addEventListener(
            "click",
            function () {

                /*
                   Remove active state from every filter.
                */

                filterButtons.forEach(
                    function (filterButton) {
                        filterButton.classList.remove(
                            "active"
                        );
                    }
                );

                /*
                   Make the clicked filter active.
                */

                button.classList.add(
                    "active"
                );

                currentFilter =
                    button.dataset.filter;

                /*
                   Re-render without another Google Sheets
                   request.
                */

                renderNewsletterHistory();
            }
        );
    }
);

/* ============================================================
   12. HISTORY MESSAGE
   ============================================================ */

function showHistoryMessage(
    message,
    type
) {
    historyMessage.textContent =
        message;

    historyMessage.className =
        "form-message history-message";

    if (type) {
        historyMessage.classList.add(
            type
        );
    }
}

/* ============================================================
   13. LOG OUT
   ============================================================ */

logoutButton.addEventListener(
    "click",
    function () {
        logoutAndRedirect();
    }
);

function logoutAndRedirect() {
    sessionStorage.removeItem(
        "alpfaAdminSession"
    );

    window.location.replace(
        "login.html"
    );
}

/* Delete only drafts; the backend independently enforces this rule. */
async function deleteNewsletterDraft(newsletter, button) {
    if (String(newsletter.status).toLowerCase() !== "draft") return;
    const confirmed = window.confirm(
        `Permanently delete the draft "${newsletter.title || newsletter.subject || "Untitled Newsletter"}"? This cannot be undone.`
    );
    if (!confirmed) return;
    const token = sessionStorage.getItem("alpfaAdminSession");
    if (!token) { logoutAndRedirect(); return; }
    button.disabled = true;
    button.textContent = "Deleting...";
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type": "text/plain;charset=utf-8"},
            body: JSON.stringify({action:"deleteNewsletterDraft", sessionToken:token, newsletterId:newsletter.id})
        });
        const result = await response.json();
        if (result.authenticated === false) { logoutAndRedirect(); return; }
        if (!result.success) throw new Error(result.message || "Unable to delete draft.");
        newsletterHistory = newsletterHistory.filter(item => item.id !== newsletter.id);
        updateHistoryCount();
        renderNewsletterHistory();
        showHistoryMessage(result.message || "Draft deleted successfully.", "success");
    } catch (error) {
        console.error("Delete draft failed:", error);
        showHistoryMessage(error.message || "Deletion failed. Refresh history before trying again.", "error");
        button.disabled = false;
        button.textContent = "Delete Draft";
    }
}
