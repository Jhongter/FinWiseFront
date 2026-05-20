// logout.js — FinWise v2
function doLogout() {
  localStorage.removeItem("finwise_jwt");
  localStorage.removeItem("finwise_user_email");
  window.location.href = "/pages/login/login.html";
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logout-btn")?.addEventListener("click", doLogout);
});
