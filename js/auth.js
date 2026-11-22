
import { supabase } from "./supabase.js";
import { $, currentProfile, showMessage } from "./common.js";

const params = new URLSearchParams(window.location.search);
const requestedRole =
  params.get("role") === "admin" ? "admin" : "employee";

$("loginTitle").textContent =
  requestedRole === "admin"
    ? "تسجيل دخول الإدارة"
    : "تسجيل دخول الموظفين";

function destination(role) {
  return role === "admin"
    ? "./admin.html"
    : "./employee.html";
}

async function initializeLogin() {
  try {
    const profile = await currentProfile();

    if (profile) {
      window.location.replace(destination(profile.role));
    }
  } catch (error) {
    console.error("Session check:", error);
  }
}

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const button = $("loginBtn");
  button.disabled = true;

  showMessage("authMessage", "جاري تسجيل الدخول...");

  try {
    const email = $("email").value.trim();
    const password = $("password").value;

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    const profile = await currentProfile();

    if (!profile) {
      throw new Error("تعذر قراءة صلاحيات الحساب");
    }

    if (profile.role !== requestedRole) {
      showMessage(
        "authMessage",
        "هذا الحساب ليس تابعًا لنوع الدخول الذي اخترته."
      );

      return;
    }

    window.location.replace(destination(profile.role));

  } catch (error) {
    console.error("Login error:", error);

    showMessage(
      "authMessage",
      "فشل تسجيل الدخول: " + error.message
    );

  } finally {
    button.disabled = false;
  }
});

initializeLogin();
