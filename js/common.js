
import { supabase } from "./supabase.js";

export const $ = id => {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`HTML element not found: #${id}`);
  }

  return element;
};

export const SERVERS = [
  "MH",
  "Neo",
  "Strong",
  "Dana"
];

export const SUBSCRIPTION_TYPES = [
  "Renew",
  "Ads",
  "Referral"
];

export const PAYMENT_METHODS = [
  "PayPal Ahmed",
  "PayPal Mohamed",
  "Stripe",
  "Zelle",
  "Cash App",
  "Venmo",
  "Bank"
];

const PAYMENT_ICONS = {
  "PayPal Ahmed": "P",
  "PayPal Mohamed": "P",
  "Stripe": "S",
  "Zelle": "Z",
  "Cash App": "$",
  "Venmo": "V",
  "Bank": "🏦"
};

export function todayString() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

export function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value) || 0);
}

export function sumSales(rows) {
  const cents = rows.reduce((total, item) => {
    return total +
      Math.round(Number(item.amount || 0) * 100);
  }, 0);

  return cents / 100;
}

export function calculateEndDate(start, months) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > 1200
  ) {
    return "";
  }

  const [year, month, day] = start
    .split("-")
    .map(Number);

  const initial = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    initial.getUTCFullYear() !== year ||
    initial.getUTCMonth() !== month - 1 ||
    initial.getUTCDate() !== day
  ) {
    return "";
  }

  const target = new Date(
    Date.UTC(year, month - 1 + months, 1)
  );

  const lastDay = new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  const anniversary = new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      Math.min(day, lastDay)
    )
  );

  anniversary.setUTCDate(
    anniversary.getUTCDate() - 1
  );

  return anniversary.toISOString().slice(0, 10);
}


export function durationInMonths(value, unit) {
  const duration = Number(value);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("من فضلك أدخل مدة صحيحة.");
  }

  if (unit !== "months" && unit !== "years") {
    throw new Error("وحدة المدة غير صحيحة.");
  }

  const months =
    unit === "years" ? duration * 12 : duration;

  if (!Number.isInteger(months)) {
    throw new Error(
      "المدة لازم تساوي عدد شهور كامل، مثال: سنة ونص أو سنتين ونص."
    );
  }

  if (months < 1 || months > 1200) {
    throw new Error("المدة لازم تكون بين شهر و100 سنة.");
  }

  return months;
}


export function formatDuration(months) {
  const number = Number(months);

  if (
    Number.isInteger(number) &&
    number > 0 &&
    number % 12 === 0
  ) {
    return `${number / 12} سنة`;
  }

  return `${number} شهر`;
}

export function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = String(value ?? "");
  row.appendChild(cell);
  return cell;
}

export function paymentBadge(method) {
  const wrapper = document.createElement("span");
  wrapper.className = "payment-badge";

  if (PAYMENT_ICONS[method]) {
    const icon = document.createElement("span");
    icon.className = "payment-icon";
    icon.textContent = PAYMENT_ICONS[method];

    wrapper.appendChild(icon);
  }

  const label = document.createElement("span");
  label.textContent = method || "غير محدد";

  wrapper.appendChild(label);

  return wrapper;
}

export function showMessage(
  id,
  message,
  success = false
) {
  const element = $(id);

  element.textContent = message;
  element.classList.toggle("success", success);
}

export async function currentProfile() {
  const { data, error } =
    await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", data.user.id)
      .single();

  if (profileError) {
    throw profileError;
  }

  return profile;
}

export async function loadAllRows(
  table,
  employeeId = null,
  columns = "*"
) {
  const results = [];
  const pageSize = 500;

  for (
    let start = 0;
    ;
    start += pageSize
  ) {
    let query = supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(start, start + pageSize - 1);

    if (employeeId !== null) {
      query = query.eq(
        "employee_id",
        employeeId
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    results.push(...(data || []));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return results;
}

export function validateSubscription(
  input,
  includeAmount = true
) {
  const months = Number(input.duration_months);

  if (
    !Number.isInteger(months) ||
    months < 1 ||
    months > 1200
  ) {
    throw new Error("مدة الاشتراك غير صحيحة");
  }

  const required = [
    "customer_name",
    "customer_username",
    "customer_country",
    "customer_phone",
    "subscription_name"
  ];

  for (const field of required) {
    if (
      !String(input[field] ?? "").trim()
    ) {
      throw new Error(
        "املأ جميع بيانات العميل"
      );
    }
  }

  if (
    !SERVERS.includes(input.subscription_name)
  ) {
    throw new Error("اختر نوع سيرفر صحيح");
  }

  if (
    !SUBSCRIPTION_TYPES.includes(
      input.subscription_type
    )
  ) {
    throw new Error("اختر نوع اشتراك صحيح");
  }

  if (
    !PAYMENT_METHODS.includes(
      input.payment_method
    )
  ) {
    throw new Error("اختر طريقة دفع صحيحة");
  }

  const endDate = calculateEndDate(
    input.start_date,
    months
  );

  if (!endDate) {
    throw new Error(
      "تاريخ بداية الاشتراك غير صحيح"
    );
  }

  const result = {
    customer_name:
      input.customer_name.trim(),

    customer_username:
      input.customer_username.trim(),

    customer_country:
      input.customer_country.trim(),

    customer_phone:
      input.customer_phone.trim(),

    subscription_name:
      input.subscription_name,

    subscription_type:
      input.subscription_type,

    payment_method:
      input.payment_method,

    duration_months: months,

    start_date: input.start_date,

    end_date: endDate
  };

  if (includeAmount) {
    const amountText =
      String(input.amount ?? "").trim();

    const amount = Number(amountText);

    if (
      !/^\d+(\.\d{1,2})?$/.test(amountText) ||
      !Number.isFinite(amount) ||
      amount > 9999999999.99
    ) {
      throw new Error(
        "قيمة الاشتراك غير صحيحة"
      );
    }

    result.amount = amount.toFixed(2);
  }

  return result;
}

export async function logout(role) {
  const { error } =
    await supabase.auth.signOut();

  if (error) throw error;

  window.location.replace(
    `./login.html?role=${role}`
  );
}
