// Settings uses the same authenticated session as the dashboard.
const SETTINGS_API_URL = "https://script.google.com/macros/s/AKfycbziql2bqL-_Ha_6s8jhIAtZc_Sb-kHSS8v50jBwp8JXwMtSnVR-0Z88V_FAujHdYPdnJA/exec";
document.addEventListener("DOMContentLoaded", async () => {
  const token = sessionStorage.getItem("alpfaAdminSession");
  if (!token) { location.replace("login.html"); return; }
  try {
    const response = await fetch(SETTINGS_API_URL, {method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"validateSession",sessionToken:token})});
    const result = await response.json();
    if (!result.success || !result.authenticated) throw new Error("Session expired");
    document.getElementById("dashboardLoading").hidden = true;
    document.getElementById("dashboardApp").hidden = false;
  } catch (error) {
    sessionStorage.removeItem("alpfaAdminSession");
    location.replace("login.html");
    return;
  }
  document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem("alpfaAdminSession"); location.replace("login.html");
  });
});
