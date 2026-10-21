/* ============================================================
   ALPFA IIT NEWSLETTER STUDIO
   NEWSLETTER BUILDER
   ============================================================

   This file currently controls:

   - Executive Board session verification
   - Protecting the Newsletter Builder
   - Logging out
   - Adding newsletter sections
   - Removing newsletter sections
   - Renumbering sections

   Later we will add:

   - Save Draft
   - Newsletter Preview
   - Send Newsletter
   ============================================================ */


/* ============================================================
   1. BACKEND API
   ============================================================ */

const API_URL =
    "https://script.google.com/macros/s/AKfycbziql2bqL-_Ha_6s8jhIAtZc_Sb-kHSS8v50jBwp8JXwMtSnVR-0Z88V_FAujHdYPdnJA/exec";

/* ============================================================
   2. PAGE ELEMENTS
   ============================================================ */

const newsletterLoading =
    document.getElementById("newsletterLoading");
const newsletterApp =
    document.getElementById("newsletterApp");
const logoutButton =
    document.getElementById("logoutButton");
const newsletterSections =
    document.getElementById("newsletterSections");
const addSectionButton =
    document.getElementById("addSectionButton");
const previewNewsletterButton =
    document.getElementById("previewNewsletterButton");
const previewModal =
    document.getElementById("previewModal");
const previewBackdrop =
    document.getElementById("previewBackdrop");
const closePreviewButton =
    document.getElementById("closePreviewButton");
const closePreviewFooterButton =
    document.getElementById("closePreviewFooterButton");
const previewSubject =
    document.getElementById("previewSubject");
const previewPreheader =
    document.getElementById("previewPreheader");
const emailPreview =
    document.getElementById("emailPreview");
const saveDraftButton =
    document.getElementById("saveDraftButton");
const draftStatus =
    document.getElementById("draftStatus");

let currentNewsletterId = "";
/* ============================================================
   3. SECTION COUNTER
   ============================================================

   The HTML already contains Section 1.

   Every new section receives its own temporary ID.
   ============================================================ */

let sectionCounter = 1;

/* ============================================================
   4. CHECK SESSION WHEN PAGE LOADS
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    validateSession
);

/* ============================================================
   5. VALIDATE ADMIN SESSION
   ============================================================ */

async function validateSession() {
    const sessionToken =
        sessionStorage.getItem("alpfaAdminSession");

    /*
       If there is no session token, the user did not log in.
    */

    if (!sessionToken) {
        window.location.replace("login.html");
        return;
    }

    const requestData = {
        action: "validateSession",
        sessionToken: sessionToken
    };

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

        /*
           Only reveal the editor if Apps Script confirms
           that the session is valid.
        */

        if (
            result.success &&
            result.authenticated
        ) {
            showNewsletterBuilder();
            return;
        }

        /*
           Invalid or expired session.
        */

        logoutAndRedirect();

    }
    catch (error) {
        console.error(
            "Newsletter authentication error:",
            error
        );

        logoutAndRedirect();
    }
}

/* ============================================================
   6. SHOW NEWSLETTER BUILDER
   ============================================================ */

async function showNewsletterBuilder() {
    newsletterLoading.style.display =
        "none";
    newsletterApp.hidden =
        false;

    /*
       Check whether this page was opened from the
       Newsletter History Edit button.

       Example:
       create-newsletter.html?id=abc123
    */

    const urlParameters =
        new URLSearchParams(
            window.location.search
        );
    const newsletterId =
        urlParameters.get("id");

    /*
       If an ID exists, load that saved newsletter
       from Google Sheets.
    */

    if (newsletterId) {
        await loadNewsletterDraft(
            newsletterId
        );
    }
}

/* ============================================================
   7. LOG OUT
   ============================================================ */

logoutButton.addEventListener(
    "click",
    logoutAndRedirect
);

function logoutAndRedirect() {
    sessionStorage.removeItem(
        "alpfaAdminSession"
    );

    window.location.replace(
        "login.html"
    );

}

/* ============================================================
   8. ADD NEWSLETTER SECTION
   ============================================================ */

addSectionButton.addEventListener(
    "click",
    addNewsletterSection
);

function addNewsletterSection() {

    /*
       Increase the internal section ID.

       This ID is mainly useful while editing.
    */

    sectionCounter++;

    /*
       Create the new section container.
    */
    const section =
        document.createElement("div");

    section.className =
        "newsletter-section";

    section.dataset.sectionId =
        sectionCounter;

    /*
       Build the fields inside the new section.

       We intentionally use the same classes as Section 1 so
       later we can collect every section using JavaScript.
    */

    section.innerHTML = `
        <div class="newsletter-section-header">
            <strong>
                Section
            </strong>
            <button
                type="button"
                class="remove-section-button"
            >
                Remove
            </button>
        </div>

        <div class="form-group">
            <label>
                Section Title
            </label>
            <input
                type="text"
                class="section-title-input"
                placeholder="Upcoming Events"
                maxlength="150"
                required
            >
        </div>

        <div class="form-group">
            <label>
                Description
            </label>
            <textarea
                class="section-description-input"
                rows="5"
                placeholder="Tell subscribers about this update..."
                required
            ></textarea>
        </div>

        <div class="section-button-fields">

            <div class="form-group">
                <label>
                    Button Text
                    <span class="optional-label">
                        Optional
                    </span>
                </label>
                <input
                    type="text"
                    class="section-button-text-input"
                    placeholder="Register Here"
                    maxlength="60"
                >
            </div>

            <div class="form-group">
                <label>
                    Button Link
                    <span class="optional-label">
                        Optional
                    </span>
                </label>
                <input
                    type="url"
                    class="section-button-url-input"
                    placeholder="https://..."
                >
            </div>

        </div>
    `;

    /*
       Add the new section to the page.
    */

    newsletterSections.appendChild(
        section
    );

    /*
       Give the Remove button functionality.
    */

    const removeButton =
        section.querySelector(
            ".remove-section-button"
        );

    removeButton.addEventListener(
        "click",
        function () {
            section.remove();
            renumberSections();
            markNewsletterUnsaved();
        }
    );

    /*
       Update the visible numbers.
    */

    renumberSections();

    /*
       Since the newsletter changed, mark it unsaved.
    */

    markNewsletterUnsaved();
}

/* ============================================================
   9. RENUMBER NEWSLETTER SECTIONS
   ============================================================

   Example:

   Section 1
   Section 2
   Section 3

   If Section 2 is removed, the remaining sections become:

   Section 1
   Section 2
   ============================================================ */

function renumberSections() {
    const sections =
        newsletterSections.querySelectorAll(
            ".newsletter-section"
        );

    sections.forEach(
        function (section, index) {
            const sectionHeader =
                section.querySelector(
                    ".newsletter-section-header strong"
                );

            sectionHeader.textContent =
                "Section " + (index + 1);
        }
    );
}

/* ============================================================
   10. MARK NEWSLETTER AS UNSAVED
   ============================================================ */

function markNewsletterUnsaved() {
    const draftStatus =
        document.getElementById("draftStatus");

    draftStatus.textContent =
        "Unsaved";

    draftStatus.className =
        "draft-status unsaved";
}

/* ============================================================
   11. NEWSLETTER PREVIEW
   ============================================================

   Builds a visual preview using the information currently
   entered in the Newsletter Builder.

   Nothing is saved or sent when Preview Newsletter is clicked.
   ============================================================ */

previewNewsletterButton.addEventListener(
    "click",
    openNewsletterPreview
);

/* ============================================================
   12. OPEN NEWSLETTER PREVIEW
   ============================================================ */

function openNewsletterPreview() {

    /* --------------------------------------------------------
       GET BASIC NEWSLETTER INFORMATION
       -------------------------------------------------------- */

    const emailSubject =
        document
            .getElementById("emailSubject")
            .value
            .trim();

    const previewText =
        document
            .getElementById("previewText")
            .value
            .trim();

    const newsletterTitle =
        document
            .getElementById("newsletterTitle")
            .value
            .trim();

    const openingMessage =
        document
            .getElementById("openingMessage")
            .value
            .trim();

    /* --------------------------------------------------------
       REQUIRE IMPORTANT FIELDS
       --------------------------------------------------------

       We don't need to save anything, but the preview should
       have enough information to actually be useful.
       -------------------------------------------------------- */

    if (
        !emailSubject ||
        !newsletterTitle ||
        !openingMessage
    ) {
        showNewsletterMessage(
            "Add a subject, newsletter title, and opening message before previewing.",
            "error"
        );
        return;
    }

    /* --------------------------------------------------------
       COLLECT NEWSLETTER SECTIONS
       -------------------------------------------------------- */

    const sectionElements =
        newsletterSections.querySelectorAll(
            ".newsletter-section"
        );

    const sections = [];

    sectionElements.forEach(
        function (sectionElement) {
            const title =
                sectionElement
                    .querySelector(
                        ".section-title-input"
                    )
                    .value
                    .trim();

            const description =
                sectionElement
                    .querySelector(
                        ".section-description-input"
                    )
                    .value
                    .trim();

            const buttonText =
                sectionElement
                    .querySelector(
                        ".section-button-text-input"
                    )
                    .value
                    .trim();

            const buttonUrl =
                sectionElement
                    .querySelector(
                        ".section-button-url-input"
                    )
                    .value
                    .trim();

            /*
               Only include sections that actually contain
               meaningful content.
            */

            if (title || description) {
                sections.push({
                    title: title,
                    description: description,
                    buttonText: buttonText,
                    buttonUrl: buttonUrl
                });
            }
        }
    );

    /* --------------------------------------------------------
       SHOW SUBJECT + PREHEADER
       -------------------------------------------------------- */

    previewSubject.textContent =
        emailSubject;

    previewPreheader.textContent =
        previewText || "No preview text";

    /* --------------------------------------------------------
       BUILD EMAIL
       -------------------------------------------------------- */

    buildEmailPreview(
        newsletterTitle,
        openingMessage,
        sections
    );

    /* --------------------------------------------------------
       OPEN MODAL
       -------------------------------------------------------- */
    previewModal.hidden =
        false;

    document.body.classList.add(
        "preview-open"
    );
}

/* ============================================================
   13. BUILD EMAIL PREVIEW
   ============================================================ */

function buildEmailPreview(
    newsletterTitle,
    openingMessage,
    sections
) {

    /*
       Clear any previous preview.
    */

    emailPreview.innerHTML = "";

    /* --------------------------------------------------------
       EMAIL HEADER
       -------------------------------------------------------- */

    const header =
        document.createElement("div");

    header.className =
        "email-template-header";

    const school =
        document.createElement("span");

    school.className =
        "email-template-school";

    school.textContent =
        "ILLINOIS INSTITUTE OF TECHNOLOGY";

    const brand =
        document.createElement("h1");

    brand.textContent =
        "ALPFA IIT";

    const accent =
        document.createElement("div");

    accent.className =
        "email-template-accent";

    header.append(
        school,
        brand,
        accent
    );

    /* --------------------------------------------------------
       EMAIL BODY
       -------------------------------------------------------- */

    const body =
        document.createElement("div");

    body.className =
        "email-template-body";

    const title =
        document.createElement("h2");

    title.className =
        "email-template-title";

    title.textContent =
        newsletterTitle;

    const opening =
        document.createElement("p");

    opening.className =
        "email-template-opening";

    opening.textContent =
        openingMessage;

    body.append(
        title,
        opening
    );

    /* --------------------------------------------------------
       NEWSLETTER SECTIONS
       -------------------------------------------------------- */

    sections.forEach(
        function (section) {
            const sectionContainer =
                document.createElement("div");

            sectionContainer.className =
                "email-template-section";

            /* Section title */

            if (section.title) {
                const sectionTitle =
                    document.createElement("h2");

                sectionTitle.textContent =
                    section.title;

                sectionContainer.appendChild(
                    sectionTitle
                );
            }

            /* Section description */

            if (section.description) {
                const description =
                    document.createElement("p");

                description.textContent =
                    section.description;

                sectionContainer.appendChild(
                    description
                );

            }

            /* --------------------------------------------
               OPTIONAL BUTTON
               --------------------------------------------

               Only display the button when BOTH button text
               and a URL were provided.
               -------------------------------------------- */

            if (
                section.buttonText &&
                section.buttonUrl
            ) {
                const button =
                    document.createElement("a");

                button.className =
                    "email-template-button";

                button.textContent =
                    section.buttonText;

                button.href =
                    section.buttonUrl;

                button.target =
                    "_blank";

                button.rel =
                    "noopener noreferrer";

                sectionContainer.appendChild(
                    button
                );
            }

            body.appendChild(
                sectionContainer
            );
        }
    );

    /* --------------------------------------------------------
       EMAIL FOOTER
       -------------------------------------------------------- */

    const footer =
        document.createElement("div");

    footer.className =
        "email-template-footer";

    const footerBrand =
        document.createElement("strong");

    footerBrand.textContent =
        "ALPFA IIT";

    const footerSchool =
        document.createElement("p");

    footerSchool.textContent =
        "Association of Latino Professionals For America at Illinois Institute of Technology";

    const footerLinks =
        document.createElement("div");

    footerLinks.className =
        "email-template-footer-links";

    /*
       These are placeholders for now.

       Later we'll pull Instagram and LinkedIn from the
       Settings tab of the database.
    */

    footerLinks.innerHTML = `
        <span>Instagram</span>
        <span class="email-template-footer-divider">•</span>
        <span>LinkedIn</span>
        <span class="email-template-footer-divider">•</span>
        <span>Unsubscribe</span>
    `;

    footer.append(
        footerBrand,
        footerSchool,
        footerLinks
    );

    /* --------------------------------------------------------
       ASSEMBLE COMPLETE EMAIL
       -------------------------------------------------------- */

    emailPreview.append(
        header,
        body,
        footer
    );
}

/* ============================================================
   14. CLOSE NEWSLETTER PREVIEW
   ============================================================ */

closePreviewButton.addEventListener(
    "click",
    closeNewsletterPreview
);

closePreviewFooterButton.addEventListener(
    "click",
    closeNewsletterPreview
);

/*
   Clicking the dark area outside the preview also closes it.
*/

previewBackdrop.addEventListener(
    "click",
    closeNewsletterPreview
);

function closeNewsletterPreview() {
    previewModal.hidden =
        true;

    document.body.classList.remove(
        "preview-open"
    );
}

/* ============================================================
   15. NEWSLETTER MESSAGE
   ============================================================ */

function showNewsletterMessage(
    message,
    type
) {
    const newsletterMessage =
        document.getElementById(
            "newsletterMessage"
        );

    newsletterMessage.textContent =
        message;

    newsletterMessage.className =
        "form-message newsletter-message";

    if (type) {
        newsletterMessage.classList.add(
            type
        );
    }
}

/* ============================================================
   SEND TEST EMAIL BUTTON
   ============================================================

   Connects the Send Test Email button to the function
   that will request a test email from Google Apps Script.

   This does NOT send an email by itself.
   The backend handles sending after validating the session.
============================================================ */

const sendTestEmailButton =
    document.getElementById("sendTestEmailButton");

sendTestEmailButton.addEventListener(
    "click",
    sendNewsletterTestEmail
);

/* ============================================================
   16. SAVE NEWSLETTER DRAFT
   ============================================================ */

saveDraftButton.addEventListener(
    "click",
    saveNewsletterDraft
);

async function saveNewsletterDraft() {

    /* --------------------------------------------------------
       GET SESSION TOKEN
       -------------------------------------------------------- */

    const sessionToken =
        sessionStorage.getItem("alpfaAdminSession");

    if (!sessionToken) {
        logoutAndRedirect();
        return;
    }

    /* --------------------------------------------------------
       GET BASIC NEWSLETTER INFORMATION
       -------------------------------------------------------- */

    const subject =
        document
            .getElementById("emailSubject")
            .value
            .trim();

    const previewText =
        document
            .getElementById("previewText")
            .value
            .trim();

    const title =
        document
            .getElementById("newsletterTitle")
            .value
            .trim();

    const openingMessage =
        document
            .getElementById("openingMessage")
            .value
            .trim();

    /* --------------------------------------------------------
       VALIDATE REQUIRED FIELDS
       -------------------------------------------------------- */

    if (
        !subject ||
        !title ||
        !openingMessage
    ) {
        showNewsletterMessage(
            "Add a subject, newsletter title, and opening message before saving.",
            "error"
        );
        return;
    }

    /* --------------------------------------------------------
       COLLECT NEWSLETTER SECTIONS
       -------------------------------------------------------- */

    const sectionElements =
        newsletterSections.querySelectorAll(
            ".newsletter-section"
        );

    const sections = [];

    sectionElements.forEach(
        function (sectionElement) {
            const sectionTitle =
                sectionElement
                    .querySelector(
                        ".section-title-input"
                    )
                    .value
                    .trim();

            const sectionDescription =
                sectionElement
                    .querySelector(
                        ".section-description-input"
                    )
                    .value
                    .trim();

            const buttonText =
                sectionElement
                    .querySelector(
                        ".section-button-text-input"
                    )
                    .value
                    .trim();

            const buttonUrl =
                sectionElement
                    .querySelector(
                        ".section-button-url-input"
                    )
                    .value
                    .trim();

            /*
               Only save sections containing actual content.
            */

            if (
                sectionTitle ||
                sectionDescription
            ) {
                sections.push({
                    title:
                        sectionTitle,
                    description:
                        sectionDescription,
                    buttonText:
                        buttonText,
                    buttonUrl:
                        buttonUrl
                });
            }
        }
    );

    /* --------------------------------------------------------
       REQUIRE AT LEAST ONE SECTION
       -------------------------------------------------------- */

    if (sections.length === 0) {
        showNewsletterMessage(
            "Add content to at least one newsletter section before saving.",
            "error"
        );
        return;
    }

    /* --------------------------------------------------------
       UPDATE BUTTON WHILE SAVING
       -------------------------------------------------------- */

    saveDraftButton.disabled =
        true;

    saveDraftButton.textContent =
        "Saving...";

    draftStatus.textContent =
        "Saving...";

    showNewsletterMessage(
        "",
        ""
    );

    /* --------------------------------------------------------
       CREATE BACKEND REQUEST
       -------------------------------------------------------- */

    const requestData = {
        action:
            "saveNewsletterDraft",
        sessionToken:
            sessionToken,
        newsletterId:
            currentNewsletterId,
        subject:
            subject,
        title:
            title,
        previewText:
            previewText,
        openingMessage:
            openingMessage,
        sections:
            sections
    };

    /* --------------------------------------------------------
       SEND DRAFT TO APPS SCRIPT
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
           SESSION EXPIRED
           ---------------------------------------------------- */

        if (
            result.authenticated === false
        ) {
            logoutAndRedirect();
            return;
        }

        /* ----------------------------------------------------
           DRAFT SAVED SUCCESSFULLY
           ---------------------------------------------------- */

        if (result.success) {

            /*
               Remember the newsletter ID returned by the
               backend.

               Future saves will update this same newsletter.
            */

            currentNewsletterId =
                result.newsletterId;

            /*
               Update the visual draft indicator.
            */

            draftStatus.textContent =
                "Saved";

            draftStatus.className =
                "draft-status saved";

            showNewsletterMessage(
                result.message ||
                "Draft saved successfully.",
                "success"
            );

            return;
        }

        /* ----------------------------------------------------
           BACKEND ERROR
           ---------------------------------------------------- */

        draftStatus.textContent =
            "Unsaved";

        draftStatus.className =
            "draft-status unsaved";

        showNewsletterMessage(
            result.message ||
                "Unable to save draft.",
            "error"
        );
    }

    /* --------------------------------------------------------
       CONNECTION ERROR
       -------------------------------------------------------- */

    catch (error) {
        console.error(
            "Save draft error:",
            error
        );

        draftStatus.textContent =
            "Unsaved";

        draftStatus.className =
            "draft-status unsaved";

        showNewsletterMessage(
            "Unable to save the draft. Please try again.",
            "error"
        );
    }

    /* --------------------------------------------------------
       RESTORE SAVE BUTTON
       -------------------------------------------------------- */

    finally {
        saveDraftButton.disabled =
            false;

        saveDraftButton.textContent =
            "Save Draft";
    }
}

/* ============================================================
   LOAD EXISTING NEWSLETTER DRAFT
   ============================================================ */

async function loadNewsletterDraft(newsletterId) {

    const sessionToken =
        sessionStorage.getItem("alpfaAdminSession");

    /*
       The editor should never retrieve newsletter data
       without a valid Executive Board session.
    */

    if (!sessionToken) {
        logoutAndRedirect();
        return;
    }

    /*
       Show that an existing newsletter is being loaded.
    */

    draftStatus.textContent =
        "Loading...";

    try {

        const response = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body: JSON.stringify({
                    action: "getNewsletter",
                    sessionToken: sessionToken,
                    newsletterId: newsletterId
                })
            }
        );

        const result =
            await response.json();

        /*
           If the Executive Board session expired,
           send the user back to login.
        */

        if (result.authenticated === false) {
            logoutAndRedirect();
            return;
        }

        /*
           Stop if Apps Script could not find or return
           the requested newsletter.
        */

        if (
            !result.success ||
            !result.newsletter
        ) {

            draftStatus.textContent =
                "Unable to load";

            showNewsletterMessage(
                result.message ||
                    "Unable to load this newsletter.",
                "error"
            );

            return;
        }

        const newsletter =
            result.newsletter;

        /*
           Store the existing Newsletter ID.

           This makes Save Draft UPDATE this newsletter
           instead of creating another database row.
        */

        currentNewsletterId =
            newsletter.id;

        /*
           Restore the main newsletter fields.
        */

        document.getElementById(
            "emailSubject"
        ).value =
            newsletter.subject || "";

        document.getElementById(
            "previewText"
        ).value =
            newsletter.previewText || "";

        document.getElementById(
            "newsletterTitle"
        ).value =
            newsletter.title || "";

        document.getElementById(
            "openingMessage"
        ).value =
            newsletter.openingMessage || "";

        /*
           We will build this function in the next step.
           It restores all saved newsletter sections.
        */

        restoreNewsletterSections(
            newsletter.sections
        );

        /*
           The newsletter has now been completely restored.
        */

        draftStatus.textContent =
            "Saved";
        draftStatus.className =
            "draft-status saved";
        showNewsletterMessage(
            "Draft loaded successfully.",
            "success"
        );
    }
    catch (error) {
        console.error(
            "Load newsletter error:",
            error
        );
        draftStatus.textContent =
            "Unable to load";
        showNewsletterMessage(
            "Unable to load this newsletter. Please try again.",
            "error"
        );
   }
}

/* ============================================================
   RESTORE SAVED NEWSLETTER SECTIONS
   ============================================================ */

function restoreNewsletterSections(sections) {

    /*
       Remove the blank default section that appears when
       the newsletter builder first opens.
    */

    newsletterSections.innerHTML = "";

    /*
       Make sure we received usable section data.

       If the newsletter somehow has no saved sections,
       create one blank section so the editor is still usable.
    */

    const savedSections =
        Array.isArray(sections) &&
        sections.length > 0
            ? sections
            : [
                {
                    title: "",
                    description: "",
                    buttonText: "",
                    buttonUrl: ""
                }
            ];

    /*
       Reset the section counter before rebuilding everything.
    */

    sectionCounter = 0;

    /*
       Rebuild every saved section.
    */

    savedSections.forEach(
        function (section) {

            sectionCounter++;

            const sectionElement =
                document.createElement("div");

            sectionElement.className =
                "newsletter-section";

            sectionElement.dataset.sectionId =
                sectionCounter;

            /*
               Build the section structure.

               Saved user content is NOT placed directly inside
               this HTML. The values are assigned safely below.
            */

            sectionElement.innerHTML = `
                <div class="newsletter-section-header">

                    <h4 class="section-number">
                        Section ${sectionCounter}
                    </h4>

                    ${
                        sectionCounter > 1
                            ? `
                                <button
                                    type="button"
                                    class="remove-section-button"
                                >
                                    Remove
                                </button>
                              `
                            : ""
                    }

                </div>

                <div class="form-group">

                    <label>
                        Section Title
                    </label>

                    <input
                        type="text"
                        class="section-title-input"
                    >

                </div>

                <div class="form-group">

                    <label>
                        Description
                    </label>

                    <textarea
                        class="section-description-input"
                        rows="5"
                    ></textarea>

                </div>

                <div class="section-button-fields">

                    <div class="form-group">

                        <label>
                            Button Text
                        </label>

                        <input
                            type="text"
                            class="section-button-text-input"
                        >

                    </div>

                    <div class="form-group">

                        <label>
                            Button URL
                        </label>

                        <input
                            type="url"
                            class="section-button-url-input"
                        >

                    </div>

                </div>
            `;

            /*
               Put the saved values back into the fields.
            */

            sectionElement.querySelector(
                ".section-title-input"
            ).value =
                section.title || "";

            sectionElement.querySelector(
                ".section-description-input"
            ).value =
                section.description || "";

            sectionElement.querySelector(
                ".section-button-text-input"
            ).value =
                section.buttonText || "";

            sectionElement.querySelector(
                ".section-button-url-input"
            ).value =
                section.buttonUrl || "";

            /*
               Connect the Remove button for sections after
               Section 1.
            */

            const removeButton =
                sectionElement.querySelector(
                    ".remove-section-button"
                );

            if (removeButton) {

                removeButton.addEventListener(
                    "click",
                    function () {

                        sectionElement.remove();

                        renumberSections();

                        markNewsletterUnsaved();
                    }
                );
            }

            /*
               Add the restored section to the editor.
            */

            newsletterSections.appendChild(
                sectionElement
            );
        }
    );
}

/* ============================================================
   SEND NEWSLETTER TEST EMAIL
   ============================================================

   Sends a test email to the ALPFA marketing Gmail account.

   SECURITY:
   - Requires an Executive Board session.
   - Requires an existing saved newsletter draft.
   - The backend determines the recipient.
   - Does NOT send emails to subscribers.
   - Does NOT change the newsletter's Draft status.

============================================================ */

async function sendNewsletterTestEmail() {

    /*
       STEP 1: Check whether the newsletter has been saved.

       The backend retrieves the saved newsletter from
       Google Sheets, so we need an existing Newsletter ID.
    */

    if (!currentNewsletterId) {
        showNewsletterMessage(
            "Please save your newsletter as a draft before sending a test email.",
            "error"
        );
        return;
    }

    /*
       STEP 2: Confirm the Executive Board is logged in.
    */

    const sessionToken =
        sessionStorage.getItem("alpfaAdminSession");
    if (!sessionToken) {
        logoutAndRedirect();
        return;
    }

    /*
       STEP 3: Prevent repeated clicks while sending.
    */

    sendTestEmailButton.disabled = true;
    sendTestEmailButton.textContent =
        "Sending Test...";

    showNewsletterMessage(
        "Sending your test newsletter...",
        "success"
    );
    try {

        /*
           STEP 4: Request a test email from Apps Script.

           The backend will:
           - Validate the session.
           - Retrieve the saved draft.
           - Generate the HTML email.
           - Send it to the marketing Gmail account.
        */

        const response = await fetch(
            API_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "sendNewsletterTest",
                    sessionToken: sessionToken,
                    newsletterId: currentNewsletterId
                })
            }
        );
        const result =
            await response.json();

        /*
           STEP 5: Handle an expired session.
        */

        if (result.authenticated === false) {
            logoutAndRedirect();
            return;
        }

        /*
           STEP 6: Display the result.
        */

        if (result.success) {
            showNewsletterMessage(
                "Test email sent successfully! Check the ALPFA marketing Gmail inbox.",
                "success"
            );
        } else {
            showNewsletterMessage(
                result.message ||
                    "Unable to send test email.",
                "error"
            );
        }
    } catch (error) {
        console.error(
            "Send test email error:",
            error
        );
        showNewsletterMessage(
            "Something went wrong while sending the test email. Please try again.",
            "error"
        );
    } finally {

        /*
           STEP 7: Restore the button after the request.
        */

        sendTestEmailButton.disabled = false;
        sendTestEmailButton.textContent =
            "Send Test Email";
    }
}

/* ============================================================
   ALPFA IIT NEWSLETTER STUDIO

   FEATURE: PREPARE NEWSLETTER DELIVERIES

   PURPOSE:
   Connect the Send Newsletter button to our backend.

   CURRENT BEHAVIOR:
   - Confirms the admin wants to prepare deliveries.
   - Checks that a saved newsletter exists.
   - Sends an authenticated request to Google Apps Script.
   - Displays the number of delivery records prepared.

   IMPORTANT:
   Actual subscriber emails are NOT sent.
============================================================ */


/* ============================================================
   STEP 1: FIND THE SEND NEWSLETTER BUTTON
============================================================ */

const sendNewsletterButton = document.getElementById(
    "sendNewsletterButton"
);


/* ============================================================
   STEP 2: CONNECT THE BUTTON
============================================================ */

if (sendNewsletterButton) {

    sendNewsletterButton.addEventListener(
        "click",
        prepareNewsletterForSending
    );

}


/* ============================================================
   FINAL SEND FLOW — ONE EXPLICIT CONFIRMATION
   The backend prepares the delivery snapshot and installs the
   recurring batch trigger. No browser-side email loop is used.
   ============================================================ */
async function prepareNewsletterForSending() {
    if (!currentNewsletterId) {
        showNewsletterMessage("Save your newsletter before sending.", "error");
        return;
    }
    if (draftStatus.classList.contains("unsaved")) {
        showNewsletterMessage("Save your latest edits before sending.", "error");
        return;
    }
    const sessionToken = sessionStorage.getItem("alpfaAdminSession");
    if (!sessionToken) { logoutAndRedirect(); return; }

    const confirmed = window.confirm(
        "SEND NEWSLETTER TO ALL ELIGIBLE ACTIVE SUBSCRIBERS?\n\n" +
        "This will send REAL emails automatically in batches of up to 20. " +
        "You cannot undo emails once sent.\n\n" +
        "Select OK only if you have reviewed the newsletter and sent a test email."
    );
    if (!confirmed) return;

    sendNewsletterButton.disabled = true;
    sendNewsletterButton.textContent = "Starting Campaign...";
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {"Content-Type":"text/plain;charset=utf-8"},
            body: JSON.stringify({
                action:"startNewsletterCampaign",
                sessionToken:sessionToken,
                newsletterId:currentNewsletterId
            })
        });
        const result = await response.json();
        if (result.authenticated === false) {
            logoutAndRedirect();
            return;
        }
        showNewsletterMessage(
            result.message || (result.success ? "Campaign queued." : "Unable to start campaign."),
            result.success ? "success" : "error"
        );
        if (result.success) {
            sendNewsletterButton.disabled = true;
            sendNewsletterButton.textContent = "Sending Scheduled";
            return;
        }
    } catch (error) {
        console.error("Newsletter campaign start error:", error);
        showNewsletterMessage(
            "Connection error. Check newsletter history before trying again; the request may have succeeded.",
            "error"
        );
    } finally {
        if (sendNewsletterButton.textContent !== "Sending Scheduled") {
            sendNewsletterButton.disabled = false;
            sendNewsletterButton.textContent = "Send Newsletter";
        }
    }
}
