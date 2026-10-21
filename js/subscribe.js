/* ============================================================
   ALPFA IIT NEWSLETTER
   PUBLIC SUBSCRIPTION JAVASCRIPT
   ============================================================

   This file controls the public newsletter subscription form.

   FLOW:
   User enters name + email
            ↓
   User clicks Subscribe
            ↓
   This JavaScript sends the information
   to Google Apps Script
            ↓
   Apps Script saves the subscriber
   in Google Sheets
            ↓
   This page displays success/error message
   ============================================================ */


/* ============================================================
   1. GOOGLE APPS SCRIPT BACKEND URL
   ============================================================

   This is the Web App URL generated when we deployed our
   Google Apps Script project.

   IMPORTANT:
   This URL is NOT a password or secret.

   It is expected to be visible in the website because the
   browser needs it in order to communicate with our backend.
   ============================================================ */

const API_URL =
    "https://script.google.com/macros/s/AKfycbziql2bqL-_Ha_6s8jhIAtZc_Sb-kHSS8v50jBwp8JXwMtSnVR-0Z88V_FAujHdYPdnJA/exec";

/* ============================================================
   2. GET HTML ELEMENTS
   ============================================================ */

// Entire subscription form
const subscribeForm =
    document.getElementById("subscribeForm");

// Name input
const subscriberName =
    document.getElementById("subscriberName");

// Email input
const subscriberEmail =
    document.getElementById("subscriberEmail");

// Subscribe button
const subscribeButton =
    document.getElementById("subscribeButton");

// Area where success/error messages appear
const subscribeMessage =
    document.getElementById("subscribeMessage");

/* ============================================================
   3. LISTEN FOR FORM SUBMISSION
   ============================================================ */

subscribeForm.addEventListener(
    "submit",
    handleSubscription
);

/* ============================================================
   4. HANDLE SUBSCRIPTION
   ============================================================ */

async function handleSubscription(event) {

    /*
       Normally an HTML form refreshes the page when submitted.

       We don't want that.

       preventDefault() keeps us on the same page so JavaScript
       can handle the submission.
    */
    event.preventDefault();

    /* --------------------------------------------------------
       GET USER INPUT
       -------------------------------------------------------- */
    const name =
        subscriberName.value.trim();
    const email =
        subscriberEmail.value
            .trim()
            .toLowerCase();

    /* --------------------------------------------------------
       BASIC FRONTEND VALIDATION
       -------------------------------------------------------- */

    if (!name || !email) {
        showMessage(
            "Please enter your name and email.",
            "error"
        );
        return;
    }

    /* --------------------------------------------------------
       CHANGE BUTTON WHILE REQUEST IS PROCESSING
       -------------------------------------------------------- */

    subscribeButton.disabled = true;
    subscribeButton.textContent =
        "Subscribing...";
    showMessage("", "");

    /* --------------------------------------------------------
       CREATE DATA FOR OUR BACKEND
       -------------------------------------------------------- */

    const requestData = {
        action: "subscribe",
        name: name,
        email: email
    };

    /* --------------------------------------------------------
       SEND REQUEST TO GOOGLE APPS SCRIPT
       -------------------------------------------------------- */

    try {
        const response = await fetch(
        API_URL,
        {
            method: "POST",

            /*
             Google Apps Script works more reliably when the
            request is sent as plain text.

            The body itself is still JSON, and our Apps Script
            backend will parse it normally.
            */
            headers: {
            "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(requestData)
        }
    );

        /* ----------------------------------------------------
           READ BACKEND RESPONSE
           ---------------------------------------------------- */

        const result =
            await response.json();

        /* ----------------------------------------------------
           SUCCESS
           ---------------------------------------------------- */

        if (result.success) {
            showMessage(
                result.message,
                "success"
            );

            /*
               Clear the form after successful subscription.
            */
            subscribeForm.reset();
        }

        /* ----------------------------------------------------
           BACKEND ERROR
           ---------------------------------------------------- */

        else {
            showMessage(
                result.message ||
                "Unable to subscribe.",
                "error"
            );
        }
    }

    /* --------------------------------------------------------
       CONNECTION ERROR
       -------------------------------------------------------- */

    catch (error) {
        console.error(
            "Subscription error:",
            error
        );

        showMessage(
            "We couldn't complete your subscription. Please try again.",
            "error"
        );
    }

    /* --------------------------------------------------------
       RESTORE BUTTON
       -------------------------------------------------------- */

    finally {
        subscribeButton.disabled = false;
        subscribeButton.textContent =
            "Subscribe";
    }
}

/* ============================================================
   5. SHOW FORM MESSAGE
   ============================================================

   message:
   The text we want displayed.

   type:
   "success" or "error"

   CSS already contains styling for both.
   ============================================================ */

function showMessage(message, type) {
    subscribeMessage.textContent =
        message;

    /*
       Reset the element back to its base class.
    */
    subscribeMessage.className =
        "form-message";

    /*
       Add success/error styling when necessary.
    */
    if (type) {
        subscribeMessage.classList.add(type);
    }
}