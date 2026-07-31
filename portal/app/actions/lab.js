"use server";

import { sql } from "@/lib/db";
import { verifyPin, setLabCookie, clearLabCookie, labAuthed } from "@/lib/labauth";
import { STATUS_LABELS } from "@/lib/status";
import { redirect } from "next/navigation";

export async function labLogin(formData) {
  const pin = (formData.get("pin") || "").toString();
  if (!verifyPin(pin)) redirect(`/lab?error=${encodeURIComponent("Incorrect PIN.")}`);
  setLabCookie();
  redirect("/lab");
}

export async function labLogout() {
  clearLabCookie();
  redirect("/lab");
}

export async function labSetStatus(formData) {
  if (!labAuthed()) redirect("/lab");
  const sampleId = (formData.get("sample_id") || "").toString().trim().toUpperCase();
  const status = (formData.get("status") || "").toString();
  if (!STATUS_LABELS.includes(status)) redirect(`/lab?id=${encodeURIComponent(sampleId)}`);

  await sql`update sample_registrations set status=${status} where sample_id=${sampleId}`;
  redirect(`/lab?id=${encodeURIComponent(sampleId)}&ok=${encodeURIComponent("Status updated to " + status)}`);
}

export async function labAttachReport(formData) {
  if (!labAuthed()) redirect("/lab");
  const sampleId = (formData.get("sample_id") || "").toString().trim().toUpperCase();
  const reportUrl = (formData.get("report_url") || "").toString().trim();
  const summary = (formData.get("summary") || "").toString().trim();

  await sql`update sample_registrations set lab_report_pdf=${reportUrl || null}, status='Results Ready' where sample_id=${sampleId}`;

  // Upsert a results row so the customer's results page has something to show.
  await sql`delete from results where sample_id=${sampleId}`;
  await sql`insert into results (sample_id, report_pdf, summary) values (${sampleId}, ${reportUrl || null}, ${summary || null})`;

  redirect(`/lab?id=${encodeURIComponent(sampleId)}&ok=${encodeURIComponent("Report attached — status set to Results Ready")}`);
}
