import { NextResponse } from "next/server";
import { plaidConfigured } from "@/lib/plaid/config";
import { removePlaidItem } from "@/lib/plaid/persistence";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!plaidConfigured()) {
    return NextResponse.json(
      { error: "Plaid is not configured on the server." },
      { status: 503 }
    );
  }

  const { id } = await ctx.params;
  const ok = await removePlaidItem(id);
  if (!ok) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
