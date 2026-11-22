
import { supabase } from "./supabase.js";

import {
  $,
  todayString,
  calculateEndDate,
  durationInMonths,
  formatDuration,
  addCell,
  paymentBadge,
  showMessage,
  currentProfile,
  loadAllRows,
  validateSubscription,
  logout
} from "./common.js";

// ==========================================
// BIXOPLAY - EMPLOYEE DASHBOARD
// ==========================================

let employeeId = null;
let subscriptions = [];
let editingId = null;

// Employee must never request the amount column.
const EMPLOYEE_COLUMNS = [
  "id",
  "employee_id",
  "customer_name",
  "customer_username",
  "customer_country",
  "customer_phone",
  "subscription_name",
  "subscription_type",
  "payment_method",
  "duration_months",
  "start_date",
  "end_date",
  "created_at"
].join(",");

// ==========================================
// DURATION AND END DATE
// ==========================================

function getDurationMonths() {
  return durationInMonths(
    $("durationValue").value,
    $("durationUnit").value
  );
}

function updateEndDate() {
  try {
    const months = getDurationMonths();

    $("endDate").value = calculateEndDate(
      $("startDate").value,
      months
    );
  } catch (error) {
    $("endDate").value = "";
  }
}

// ==========================================
// PRICE VISIBILITY
// ==========================================

function showPriceField() {
  $("priceField").hidden = false;
  $("amount").required = true;
  $("amount").value = "";
}

function hidePriceField() {
  $("priceField").hidden = true;
  $("amount").required = false;
  $("amount").value = "";
}

// ==========================================
// RESET FORM
// ==========================================

function resetForm() {
  editingId = null;

  $("subscriptionForm").reset();

  $("startDate").value = todayString();

  $("durationValue").value = "";
  $("durationUnit").value = "months";

  updateEndDate();
  showPriceField();

  $("formTitle").textContent =
    "إضافة اشتراك جديد";

  $("saveBtn").textContent =
    "حفظ الاشتراك";

  $("cancelEditBtn").hidden = true;
}

// ==========================================
// OPEN SUBSCRIPTION FOR EDITING
// ==========================================

function openEdit(item) {
  editingId = item.id;

  $("customerName").value =
    item.customer_name || "";

  $("customerUsername").value =
    item.customer_username || "";

  $("country").value =
    item.customer_country || "";

  $("customerPhone").value =
    item.customer_phone || "";

  $("subscriptionName").value =
    item.subscription_name || "";

  $("subscriptionType").value =
    item.subscription_type || "";

  $("paymentMethod").value =
    item.payment_method || "";

  $("durationValue").value =
    item.duration_months;

  $("durationUnit").value = "months";

  $("startDate").value =
    item.start_date;

  updateEndDate();

  // The employee must not see or edit old prices.
  hidePriceField();

  $("formTitle").textContent =
    "تعديل بيانات الاشتراك";

  $("saveBtn").textContent =
    "حفظ التعديلات";

  $("cancelEditBtn").hidden = false;

  showMessage(
    "formMessage",
    "يمكنك تعديل بيانات العميل، لكن السعر متاح للإدارة فقط."
  );

  $("formSection").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// ==========================================
// READ AND VALIDATE FORM
// ==========================================

function readForm() {
  const isNew = editingId === null;

  const input = {
    customer_name:
      $("customerName").value,

    customer_username:
      $("customerUsername").value,

    customer_country:
      $("country").value,

    customer_phone:
      $("customerPhone").value,

    subscription_name:
      $("subscriptionName").value,

    subscription_type:
      $("subscriptionType").value,

    payment_method:
      $("paymentMethod").value,

    duration_months:
      getDurationMonths(),

    start_date:
      $("startDate").value
  };

  // Amount is accepted during INSERT only.
  if (isNew) {
    input.amount = $("amount").value;
  }

  return validateSubscription(input, isNew);
}

// ==========================================
// RENDER EMPLOYEE SUBSCRIPTIONS TABLE
// ==========================================

function renderSubscriptions() {
  const tbody = $("subscriptionsBody");

  tbody.replaceChildren();

  if (subscriptions.length === 0) {
    const row = document.createElement("tr");

    const cell = addCell(
      row,
      "لا توجد اشتراكات مسجلة حتى الآن"
    );

    cell.colSpan = 11;

    tbody.appendChild(row);
    return;
  }

  const sorted = [...subscriptions].sort(
    (a, b) => Number(b.id) - Number(a.id)
  );

  for (const item of sorted) {
    const row = document.createElement("tr");

    // Customer information
    addCell(row, item.customer_name);

    addCell(
      row,
      item.customer_username || "—"
    );

    addCell(
      row,
      item.customer_country || "—"
    );

    addCell(
      row,
      item.customer_phone || "—"
    );

    // Server and subscription information
    addCell(
      row,
      item.subscription_name || "—"
    );

    addCell(
      row,
      item.subscription_type || "—"
    );

    // Payment method
    const paymentCell =
      document.createElement("td");

    paymentCell.appendChild(
      paymentBadge(item.payment_method)
    );

    row.appendChild(paymentCell);

    // Duration and dates
    addCell(
      row,
      formatDuration(item.duration_months)
    );

    addCell(
      row,
      item.start_date || "—"
    );

    addCell(
      row,
      item.end_date || "—"
    );

    // Edit action
    const actionCell =
      document.createElement("td");

    const editButton =
      document.createElement("button");

    editButton.type = "button";

    editButton.className =
      "btn btn-blue";

    editButton.textContent = "تعديل";

    editButton.addEventListener(
      "click",
      () => {
        openEdit(item);
      }
    );

    actionCell.appendChild(editButton);
    row.appendChild(actionCell);

    tbody.appendChild(row);
  }
}

// ==========================================
// LOAD EMPLOYEE SUBSCRIPTIONS
// ==========================================

async function refreshSubscriptions() {
  // Fetch only non-financial columns.
  // Database permissions must also block amount.

  subscriptions = await loadAllRows(
    "subscriptions",
    employeeId,
    EMPLOYEE_COLUMNS
  );

  renderSubscriptions();
}

// ==========================================
// SAVE OR UPDATE SUBSCRIPTION
// ==========================================

async function saveSubscription(event) {
  event.preventDefault();

  const button = $("saveBtn");
  button.disabled = true;

  try {
    const isEditing = editingId !== null;

    const payload = readForm();

    let result;

    if (isEditing) {
      // Update customer information only.
      // No amount is included.

      result = await supabase
        .from("subscriptions")
        .update(payload)
        .eq("id", editingId)
        .eq("employee_id", employeeId)
        .select("id");

    } else {
      // Amount is inserted once.
      // The employee cannot retrieve it afterward.

      result = await supabase
        .from("subscriptions")
        .insert({
          ...payload,
          employee_id: employeeId,
          currency: "USD"
        })
        .select("id");
    }

    if (result.error) {
      throw result.error;
    }

    if (result.data?.length !== 1) {
      throw new Error(
        "لم يتم حفظ الاشتراك. تحقق من صلاحيات الحساب."
      );
    }

    resetForm();

    try {
      await refreshSubscriptions();

      showMessage(
        "formMessage",
        isEditing
          ? "تم تعديل بيانات الاشتراك بنجاح."
          : "تم تسجيل الاشتراك بنجاح.",
        true
      );

    } catch (refreshError) {
      console.error(
        "Refresh after save:",
        refreshError
      );

      showMessage(
        "formMessage",
        "تم حفظ الاشتراك، لكن تعذر تحديث الجدول. اضغط تحديث البيانات."
      );
    }

  } catch (error) {
    console.error(
      "Subscription save error:",
      error
    );

    showMessage(
      "formMessage",
      "فشل الحفظ: " + error.message
    );

  } finally {
    button.disabled = false;
  }
}

// ==========================================
// INITIALIZE EMPLOYEE DASHBOARD
// ==========================================

async function initializeEmployee() {
  try {
    // Check authentication and actual database role.
    const profile = await currentProfile();

    if (!profile) {
      window.location.replace(
        "./login.html?role=employee"
      );

      return;
    }

    if (profile.role !== "employee") {
      throw new Error(
        "هذا الحساب ليس لديه صلاحية دخول الموظفين."
      );
    }

    employeeId = profile.id;

    $("employeeWelcome").textContent =
      `مرحبًا ${profile.full_name}`;

    // Form submit
    $("subscriptionForm").addEventListener(
      "submit",
      saveSubscription
    );

    // Start date
    $("startDate").addEventListener(
      "change",
      updateEndDate
    );

    // Duration number
    $("durationValue").addEventListener(
      "input",
      updateEndDate
    );

    // Duration unit
    $("durationUnit").addEventListener(
      "change",
      updateEndDate
    );

    // Cancel edit
    $("cancelEditBtn").addEventListener(
      "click",
      () => {
        resetForm();

        showMessage(
          "formMessage",
          "تم إلغاء التعديل."
        );
      }
    );

    // Refresh table
    $("refreshBtn").addEventListener(
      "click",
      async () => {
        try {
          await refreshSubscriptions();

          showMessage(
            "formMessage",
            "تم تحديث البيانات بنجاح.",
            true
          );

        } catch (error) {
          console.error(
            "Employee refresh error:",
            error
          );

          showMessage(
            "formMessage",
            "فشل تحديث البيانات: " +
            error.message
          );
        }
      }
    );

    // Logout
    $("logoutBtn").addEventListener(
      "click",
      async () => {
        try {
          await logout("employee");

        } catch (error) {
          console.error(
            "Employee logout error:",
            error
          );

          showMessage(
            "formMessage",
            "فشل تسجيل الخروج: " +
            error.message
          );
        }
      }
    );

    // Initialize UI
    resetForm();

    // Load subscriptions from Supabase
    await refreshSubscriptions();

    // Show dashboard only after successful load.
    $("pageMessage").hidden = true;
    $("employeeDashboard").hidden = false;

  } catch (error) {
    console.error(
      "Employee initialization:",
      error
    );

    $("pageMessage").textContent =
      "تعذر فتح لوحة الموظف: " +
      error.message;
  }
}

// ==========================================
// START APPLICATION
// ==========================================

initializeEmployee();
