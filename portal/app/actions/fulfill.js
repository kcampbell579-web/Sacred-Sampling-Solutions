"use server";

import { sql } from "@/lib/db";
import { verifyPin, setFulfillCookie, clearFulfillCookie, fulfillAuthed } from "@/lib/fulfillauth";
import { redirect } from "next/navigation";

const STATUSES = ["new", "shipped", "fulfilled"];

export async function fulfillLogin(formData) {
  const pin = (formData.get("pin") || "").toString();
  if (!verifyPin(pin)) redirect(`/fulfillment?error=${encodeURIComponent("Incorrect PIN.")}`);
  setFulfillCookie();
  redirect("/fulfillment");
}

export async function fulfillLogout() {
  clearFulfillCookie();
  redirect("/fulfillment");
}

export async function setOrderStatus(formData) {
  if (!fulfillAuthed()) redirect("/fulfillment");
  const id = Number(formData.get("id"));
  const status = (formData.get("status") || "").toString();
  if (!id || !STATUSES.includes(status)) redirect("/fulfillment");

  if (status === "shipped") {
    await sql`update orders set status='shipped', shipped_at=coalesce(shipped_at, now()) where id=${id}`;
  } else if (status === "new") {
    await sql`update orders set status='new', shipped_at=null where id=${id}`;
  } else {
    await sql`update orders set status=${status} where id=${id}`;
  }
  redirect(`/fulfillment?ok=${encodeURIComponent("Order updated")}`);
}
