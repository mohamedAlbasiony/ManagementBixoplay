
import { supabase } from "./supabase.js";

import {
  $,
  SERVERS,
  SUBSCRIPTION_TYPES,
  PAYMENT_METHODS,
  todayString,
  money,
  sumSales,
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

let employees = [];
let subscriptions = [];
let filteredSubscriptions = [];
let editingId = null;

// =====================================
// HELPERS
// =====================================

function employeeName(id) {
  return employees.find(
    employee => employee.id === id
  )?.full_name || "غير معروف";
}

function setOptions(
  id,
  options,
  defaultLabel
) {
  const select = $(id);
  const previous = select.value;

  select.replaceChildren(
    new Option(defaultLabel, "all")
  );

  for (const item of options) {
    select.add(
      new Option(item.label, item.value)
    );
  }

  const exists = Array.from(
    select.options
  ).some(item => item.value === previous);

  select.value = exists
    ? previous
    : "all";
}

function updateFilterOptions() {
  const staffOptions = employees
    .filter(e => e.role === "employee")
    .sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    )
    .map(e => ({
      label: e.full_name,
      value: e.id
    }));

  setOptions(
    "employeeFilter",
    staffOptions,
    "كل الموظفين"
  );

  const countries = [
    ...new Set(
      subscriptions
        .map(s => s.customer_country)
        .filter(Boolean)
    )
  ].sort();

  setOptions(
    "countryFilter",
    countries.map(country => ({
      label: country,
      value: country
    })),
    "كل الدول"
  );

  const servers = [
    ...new Set([
      ...SERVERS,
      ...subscriptions
        .map(s => s.subscription_name)
        .filter(Boolean)
    ])
  ].sort();

  setOptions(
    "serverFilter",
    servers.map(server => ({
      label: server,
      value: server
    })),
    "كل السيرفرات"
  );

  const typeOptions = SUBSCRIPTION_TYPES.map(
    type => ({
      label: type,
      value: type
    })
  );

  typeOptions.push({
    label: "غير محدد (قديم)",
    value: "__empty__"
  });

  setOptions(
    "typeFilter",
    typeOptions,
    "كل الأنواع"
  );

  const paymentOptions = PAYMENT_METHODS.map(
    method => ({
      label: method,
      value: method
    })
  );

  paymentOptions.push({
    label: "غير محدد (قديم)",
    value: "__empty__"
  });

  setOptions(
    "paymentFilter",
    paymentOptions,
    "كل طرق الدفع"
  );
}

// =====================================
// ADMIN DATABASE DATA
// =====================================

async function loadAdminSubscriptions() {
  const rows = [];
  const pageSize = 500;

  for (
    let start = 0;
    ;
    start += pageSize
  ) {
    const { data, error } = await supabase
      .rpc("admin_list_subscriptions")
      .range(start, start + pageSize - 1);

    if (error) throw error;

    rows.push(...(data || []));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return rows;
}

async function refreshData() {
  const [profiles, records] = await Promise.all([
    loadAllRows("profiles"),
    loadAdminSubscriptions()
  ]);

  employees = profiles;
  subscriptions = records;

  updateFilterOptions();
  render();
}

// =====================================
// FILTERS
// =====================================

function getFilteredSubscriptions() {
  const month = $("monthFilter").value;
  const employee = $("employeeFilter").value;
  const country = $("countryFilter").value;
  const server = $("serverFilter").value;
  const type = $("typeFilter").value;
  const payment = $("paymentFilter").value;

  return subscriptions.filter(item => {
    const monthMatch =
      !month ||
      item.start_date?.startsWith(month);

    const employeeMatch =
      employee === "all" ||
      item.employee_id === employee;

    const countryMatch =
      country === "all" ||
      item.customer_country === country;

    const serverMatch =
      server === "all" ||
      item.subscription_name === server;

    const typeMatch =
      type === "all" ||
      (
        type === "__empty__"
          ? !item.subscription_type
          : item.subscription_type === type
      );

    const paymentMatch =
      payment === "all" ||
      (
        payment === "__empty__"
          ? !item.payment_method
          : item.payment_method === payment
      );

    return (
      monthMatch &&
      employeeMatch &&
      countryMatch &&
      serverMatch &&
      typeMatch &&
      paymentMatch
    );
  });
}

// =====================================
// STATS
// =====================================

function renderStats() {
  const today = todayString();

  $("totalSubscriptions").textContent =
    filteredSubscriptions.length;

  $("totalSales").textContent =
    money(sumSales(filteredSubscriptions));

  $("totalEmployees").textContent =
    employees.filter(
      e => e.role === "employee"
    ).length;

  $("activeSubscriptions").textContent =
    filteredSubscriptions.filter(item =>
      item.start_date <= today &&
      item.end_date >= today
    ).length;
}

// =====================================
// EMPLOYEE PERFORMANCE
// =====================================

function renderEmployees() {
  const tbody = $("employeesReport");
  tbody.replaceChildren();

  const selected = $("employeeFilter").value;

  const report = employees
    .filter(e =>
      e.role === "employee" &&
      (
        selected === "all" ||
        e.id === selected
      )
    )
    .map(employee => {
      const rows = filteredSubscriptions.filter(
        s => s.employee_id === employee.id
      );

      return {
        name: employee.full_name,
        count: rows.length,
        sales: sumSales(rows)
      };
    })
    .sort((a, b) => b.sales - a.sales);

  if (!report.length) {
    const tr = document.createElement("tr");
    const td = addCell(tr, "لا يوجد موظفون");

    td.colSpan = 3;
    tbody.appendChild(tr);
    return;
  }

  for (const item of report) {
    const tr = document.createElement("tr");

    addCell(tr, item.name);
    addCell(tr, item.count);
    addCell(tr, money(item.sales));

    tbody.appendChild(tr);
  }
}

// =====================================
// SUBSCRIPTIONS TABLE
// =====================================

function renderSubscriptions() {
  const tbody = $("subscriptionsReport");
  tbody.replaceChildren();

  if (!filteredSubscriptions.length) {
    const tr = document.createElement("tr");
    const td = addCell(
      tr,
      "لا توجد اشتراكات مطابقة للفلاتر"
    );

    td.colSpan = 14;
    tbody.appendChild(tr);
    return;
  }

  const sorted = [...filteredSubscriptions].sort(
    (a, b) => Number(b.id) - Number(a.id)
  );

  const today = todayString();

  for (const item of sorted) {
    const tr = document.createElement("tr");

    addCell(tr, employeeName(item.employee_id));
    addCell(tr, item.customer_name);
    addCell(tr, item.customer_username || "—");
    addCell(tr, item.customer_country);
    addCell(tr, item.customer_phone || "—");
    addCell(tr, item.subscription_name);
    addCell(tr, item.subscription_type || "—");

    const paymentCell =
      document.createElement("td");

    paymentCell.appendChild(
      paymentBadge(item.payment_method)
    );

    tr.appendChild(paymentCell);

    addCell(
      tr,
      formatDuration(item.duration_months)
    );

    addCell(tr, item.start_date);
    addCell(tr, item.end_date);
    addCell(tr, money(item.amount));

    const status =
      item.start_date > today
        ? "لم يبدأ"
        : item.end_date < today
          ? "منتهي"
          : "نشط";

    addCell(tr, status);

    const actionsCell =
      document.createElement("td");

    const actions =
      document.createElement("div");

    actions.className = "table-actions";

    const editButton =
      document.createElement("button");

    editButton.type = "button";
    editButton.className = "btn btn-blue";
    editButton.textContent = "تعديل";

    editButton.addEventListener(
      "click",
      () => openEdit(item)
    );

    const deleteButton =
      document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className =
      "btn btn-danger";

    deleteButton.textContent = "حذف";

    deleteButton.addEventListener(
      "click",
      () => deleteSubscription(item.id)
    );

    actions.append(
      editButton,
      deleteButton
    );

    actionsCell.appendChild(actions);
    tr.appendChild(actionsCell);

    tbody.appendChild(tr);
  }
}

// =====================================
// RENDER
// =====================================

function render() {
  filteredSubscriptions =
    getFilteredSubscriptions();

  renderStats();
  renderEmployees();
  renderSubscriptions();
}

// =====================================
// EDIT SUBSCRIPTION
// =====================================

function updateEditEndDate() {
  try {
    const months = durationInMonths(
      $("editDurationValue").value,
      $("editDurationUnit").value
    );

    $("editEnd").value = calculateEndDate(
      $("editStart").value,
      months
    );

  } catch {
    $("editEnd").value = "";
  }
}

function openEdit(item) {
  editingId = item.id;

  $("editCustomer").value =
    item.customer_name || "";

  $("editUsername").value =
    item.customer_username || "";

  $("editCountry").value =
    item.customer_country || "";

  $("editPhone").value =
    item.customer_phone || "";

  $("editServer").value =
    item.subscription_name || "";

  $("editType").value =
    item.subscription_type || "";

  $("editPaymentMethod").value =
    item.payment_method || "";

  $("editDurationValue").value =
    item.duration_months;

  $("editDurationUnit").value = "months";

  $("editStart").value =
    item.start_date;

  $("editAmount").value =
    item.amount;

  updateEditEndDate();

  showMessage("editMessage", "");

  $("adminEditDialog").showModal();
}

function readEditForm() {
  const months = durationInMonths(
    $("editDurationValue").value,
    $("editDurationUnit").value
  );

  return validateSubscription({
    customer_name:
      $("editCustomer").value,

    customer_username:
      $("editUsername").value,

    customer_country:
      $("editCountry").value,

    customer_phone:
      $("editPhone").value,

    subscription_name:
      $("editServer").value,

    subscription_type:
      $("editType").value,

    payment_method:
      $("editPaymentMethod").value,

    duration_months: months,

    start_date:
      $("editStart").value,

    amount:
      $("editAmount").value
  });
}

async function verifyAdminAgain() {
  const profile = await currentProfile();

  if (
    !profile ||
    profile.role !== "admin"
  ) {
    throw new Error(
      "ليس لديك صلاحية الإدارة"
    );
  }
}

async function saveEdit(event) {
  event.preventDefault();

  if (editingId === null) return;

  const button = $("adminSaveEdit");
  button.disabled = true;

  try {
    await verifyAdminAgain();

    const payload = readEditForm();

    const { data, error } = await supabase.rpc(
      "admin_update_subscription",
      {
        p_id: editingId,
        p_customer_name:
          payload.customer_name,

        p_customer_username:
          payload.customer_username,

        p_customer_country:
          payload.customer_country,

        p_customer_phone:
          payload.customer_phone,

        p_subscription_name:
          payload.subscription_name,

        p_subscription_type:
          payload.subscription_type,

        p_payment_method:
          payload.payment_method,

        p_duration_months:
          payload.duration_months,

        p_start_date:
          payload.start_date,

        p_end_date:
          payload.end_date,

        p_amount:
          payload.amount
      }
    );

    if (error) throw error;

    if (data === null || data === undefined) {
      throw new Error(
        "لم يتم تعديل الاشتراك"
      );
    }

    $("adminEditDialog").close();

    try {
      await refreshData();

      showMessage(
        "adminMessage",
        "تم تعديل الاشتراك بنجاح",
        true
      );

    } catch (refreshError) {
      console.error(
        "Refresh after update:",
        refreshError
      );

      showMessage(
        "adminMessage",
        "تم حفظ التعديل، لكن فشل تحديث التقرير"
      );
    }

  } catch (error) {
    console.error("Admin edit:", error);

    showMessage(
      "editMessage",
      "فشل التعديل: " + error.message
    );

  } finally {
    button.disabled = false;
  }
}

// =====================================
// DELETE SUBSCRIPTION
// =====================================

async function deleteSubscription(id) {
  const confirmed = window.confirm(
    "هل أنت متأكد من حذف الاشتراك نهائيًا؟"
  );

  if (!confirmed) return;

  try {
    await verifyAdminAgain();

    const { data, error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;

    if (data?.length !== 1) {
      throw new Error(
        "لم يتم حذف الاشتراك. راجع الصلاحيات."
      );
    }

    try {
      await refreshData();

      showMessage(
        "adminMessage",
        "تم حذف الاشتراك بنجاح",
        true
      );

    } catch (refreshError) {
      console.error(
        "Refresh after deletion:",
        refreshError
      );

      showMessage(
        "adminMessage",
        "تم الحذف لكن فشل تحديث التقرير"
      );
    }

  } catch (error) {
    console.error("Admin delete:", error);

    showMessage(
      "adminMessage",
      "فشل الحذف: " + error.message
    );
  }
}

// =====================================
// CSV EXPORT - ADMIN ONLY
// =====================================

function exportCSV() {
  const rows = [
    [
      "Employee",
      "Customer",
      "Username",
      "Country",
      "Phone",
      "Server",
      "Subscription Type",
      "Payment Method",
      "Duration Months",
      "Start Date",
      "End Date",
      "Amount",
      "Currency"
    ]
  ];

  for (const item of filteredSubscriptions) {
    rows.push([
      employeeName(item.employee_id),
      item.customer_name,
      item.customer_username || "",
      item.customer_country,
      item.customer_phone || "",
      item.subscription_name,
      item.subscription_type || "",
      item.payment_method || "",
      item.duration_months,
      item.start_date,
      item.end_date,
      item.amount,
      item.currency || "USD"
    ]);
  }

  const escapeCSV = value => {
    let text = String(value ?? "");

    if (/^\s*[=+\-@\t\r]/.test(text)) {
      text = "'" + text;
    }

    return '"' +
      text.replaceAll('"', '""') +
      '"';
  };

  const csv = "\uFEFF" +
    rows.map(
      row => row.map(escapeCSV).join(",")
    ).join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "bixoplay-report.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}

// =====================================
// INITIALIZE ADMIN
// =====================================

async function initializeAdmin() {
  try {
    const profile = await currentProfile();

    if (!profile) {
      window.location.replace(
        "./login.html?role=admin"
      );
      return;
    }

    if (profile.role !== "admin") {
      throw new Error(
        "الحساب الحالي ليس لديه صلاحية الإدارة"
      );
    }

    $("adminWelcome").textContent =
      `مرحبًا ${profile.full_name}`;

    $("monthFilter").value =
      todayString().slice(0, 7);

    const filters = [
      "monthFilter",
      "employeeFilter",
      "countryFilter",
      "serverFilter",
      "typeFilter",
      "paymentFilter"
    ];

    for (const id of filters) {
      $(id).addEventListener(
        "change",
        render
      );
    }

    $("resetFilters").addEventListener(
      "click",
      () => {
        $("monthFilter").value = "";
        $("employeeFilter").value = "all";
        $("countryFilter").value = "all";
        $("serverFilter").value = "all";
        $("typeFilter").value = "all";
        $("paymentFilter").value = "all";

        render();
      }
    );

    $("reloadBtn").addEventListener(
      "click",
      async () => {
        try {
          await refreshData();

          showMessage(
            "adminMessage",
            "تم تحديث البيانات",
            true
          );

        } catch (error) {
          showMessage(
            "adminMessage",
            "فشل التحديث: " + error.message
          );
        }
      }
    );

    $("exportBtn").addEventListener(
      "click",
      exportCSV
    );

    $("adminEditForm").addEventListener(
      "submit",
      saveEdit
    );

    $("editStart").addEventListener(
      "change",
      updateEditEndDate
    );

    $("editDurationValue").addEventListener(
      "input",
      updateEditEndDate
    );

    $("editDurationUnit").addEventListener(
      "change",
      updateEditEndDate
    );

    $("adminCancelEdit").addEventListener(
      "click",
      () => $("adminEditDialog").close()
    );

    $("adminEditDialog").addEventListener(
      "close",
      () => {
        editingId = null;
      }
    );

    $("logoutBtn").addEventListener(
      "click",
      async () => {
        try {
          await logout("admin");

        } catch (error) {
          showMessage(
            "adminMessage",
            "فشل تسجيل الخروج: " +
            error.message
          );
        }
      }
    );

    await refreshData();

    $("pageMessage").hidden = true;
    $("adminDashboard").hidden = false;

  } catch (error) {
    console.error(
      "Admin initialization:",
      error
    );

    $("pageMessage").textContent =
      "تعذر فتح لوحة الإدارة: " +
      error.message;
  }
}

initializeAdmin();
