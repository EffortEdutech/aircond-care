/** Sen (1/100 ringgit) as "RM 80.00". */
export function rm(sen: number | null | undefined): string {
  if (sen === null || sen === undefined) return "Quote";
  return `RM ${(sen / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
