import { cookies } from "next/headers";

export const LOCALES = ["en", "ms", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = { en: "English", ms: "Bahasa Melayu", zh: "中文" };

const en = {
  appName: "Aircond Care",
  tagline: "Book trusted aircond servicing and keep a full history of every unit.",
  signIn: "Sign in",
  signUp: "Create account",
  signOut: "Sign out",
  email: "Email",
  password: "Password",
  fullName: "Full name",
  units: "My units",
  addresses: "Addresses",
  account: "Account",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  add: "Add",
  addUnit: "Add a unit",
  addAddress: "Add an address",
  noUnits: "No units yet. Add your first aircond unit to start its service history.",
  noAddresses: "No addresses yet. Add where your units are installed.",
  language: "Language",
  phone: "Phone",
  history: "Service history",
  noHistory: "No service history yet. Completed jobs will appear here.",
  checkEmail: "Check your email to confirm your account, then sign in.",
  findContractor: "Find a contractor",
  bookings: "Bookings",
} as const;

export type MessageKey = keyof typeof en;

// Malay and Chinese cover the core screens. Anything missing falls back to English.
// Needs review by native speakers before launch (Sprint 8).
const ms: Partial<Record<MessageKey, string>> = {
  tagline: "Tempah servis aircond yang dipercayai dan simpan sejarah penuh setiap unit.",
  signIn: "Log masuk",
  signUp: "Daftar akaun",
  signOut: "Log keluar",
  email: "E-mel",
  password: "Kata laluan",
  fullName: "Nama penuh",
  units: "Unit saya",
  addresses: "Alamat",
  account: "Akaun",
  save: "Simpan",
  cancel: "Batal",
  delete: "Padam",
  edit: "Ubah",
  add: "Tambah",
  addUnit: "Tambah unit",
  addAddress: "Tambah alamat",
  noUnits: "Belum ada unit. Tambah unit aircond pertama anda untuk mula merekod sejarah servis.",
  noAddresses: "Belum ada alamat. Tambah lokasi unit anda dipasang.",
  language: "Bahasa",
  phone: "Telefon",
  history: "Sejarah servis",
  noHistory: "Belum ada sejarah servis. Kerja yang siap akan dipaparkan di sini.",
  checkEmail: "Semak e-mel anda untuk mengesahkan akaun, kemudian log masuk.",
  findContractor: "Cari kontraktor",
  bookings: "Tempahan",
};

const zh: Partial<Record<MessageKey, string>> = {
  tagline: "预约可靠的冷气保养服务，并保存每台冷气的完整记录。",
  signIn: "登录",
  signUp: "注册账户",
  signOut: "退出登录",
  email: "电子邮件",
  password: "密码",
  fullName: "全名",
  units: "我的冷气",
  addresses: "地址",
  account: "账户",
  save: "保存",
  cancel: "取消",
  delete: "删除",
  edit: "编辑",
  add: "添加",
  addUnit: "添加冷气",
  addAddress: "添加地址",
  noUnits: "还没有冷气。添加第一台冷气，开始记录保养历史。",
  noAddresses: "还没有地址。添加冷气安装的地点。",
  language: "语言",
  phone: "电话",
  history: "保养记录",
  noHistory: "还没有保养记录。完成的工作会显示在这里。",
  checkEmail: "请查看电子邮件确认账户，然后登录。",
  findContractor: "寻找承包商",
  bookings: "预约",
};

const dictionaries: Record<Locale, Partial<Record<MessageKey, string>>> = { en, ms, zh };

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function translator(locale: Locale) {
  return (key: MessageKey): string => dictionaries[locale][key] ?? en[key];
}

/** The visitor's language: a cookie set from their profile or the language picker, else English. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return isLocale(value) ? value : "en";
}

export async function getT() {
  return translator(await getLocale());
}
