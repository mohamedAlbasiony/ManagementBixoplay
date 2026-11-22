
import { supabase } from "./supabase.js";
import { $, showMessage } from "./common.js";

let recoveryAllowed = false;

function enableRecovery() {
  recoveryAllowed = true;
  $("resetBtn").disabled = false;

  showMessage(
    "message",
    "تم التحقق من جلسة الاسترجاع. اكتب كلمة المرور الجديدة.",
    true
  );
}

const { data: authListener } =
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      enableRecovery();
    }
  });

const hashParams = new URLSearchParams(
  window.location.hash.slice(1)
);

const queryParams = new URLSearchParams(
  window.location.search
);

const tokenHash = queryParams.get("token_hash");
const type = queryParams.get("type");

async function verifyRecoveryLink() {
  try {
    if (hashParams.get("type") === "recovery") {
      // Supabase will process the URL session automatically.
      const { data, error } =
        await supabase.auth.getSession();

      if (error) throw error;

      if (data.session) {
        enableRecovery();
        return;
      }
    }

    if (tokenHash && type === "recovery") {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery"
      });

      if (error) throw error;

      enableRecovery();
      return;
    }

    const { data } = await supabase.auth.getSession();

    // Do not treat an ordinary login as a recovery session.
    if (!recoveryAllowed) {
      showMessage(
        "message",
        "افتح رابط استرجاع كلمة المرور من البريد الإلكتروني."
      );
    }

  } catch (error) {
    showMessage(
      "message",
      "رابط الاسترجاع غير صالح أو انتهت صلاحيته: " +
      error.message
    );
  }
}

$("resetForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!recoveryAllowed) {
    showMessage(
      "message",
      "لا توجد جلسة استرجاع صالحة."
    );
    return;
  }

  const password = $("password").value;
  const confirmation = $("confirmPassword").value;

  if (password !== confirmation) {
    showMessage("message", "كلمتا المرور غير متطابقتين.");
    return;
  }

  const button = $("resetBtn");
  button.disabled = true;

  try {
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) throw error;

    showMessage(
      "message",
      "تم تغيير كلمة المرور بنجاح. ارجع لتسجيل الدخول.",
      true
    );

    await supabase.auth.signOut();
    authListener.subscription.unsubscribe();

  } catch (error) {
    showMessage(
      "message",
      "فشل تغيير كلمة المرور: " + error.message
    );

    button.disabled = false;
  }
});

verifyRecoveryLink();
