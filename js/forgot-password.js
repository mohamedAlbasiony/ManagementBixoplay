
import { supabase } from "./supabase.js";
import { $, showMessage } from "./common.js";

$("forgotForm").addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    const button = $("sendBtn");
    button.disabled = true;

    try {
      const email = $("email").value.trim();

      const redirectTo = new URL(
        "./reset-password.html",
        window.location.href
      ).href;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo }
        );

      if (error) throw error;

      showMessage(
        "message",
        "لو البريد مسجل ومسموح بإرسال الرسائل إليه، هيوصلك رابط استرجاع كلمة المرور.",
        true
      );

    } catch (error) {
      console.error("Password reset email:", error);
      showMessage(
        "message",
        "فشل إرسال الرابط: " + error.message
      );

    } finally {
      button.disabled = false;
    }
  }
);
