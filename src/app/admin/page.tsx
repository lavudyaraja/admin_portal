import { redirect } from "next/navigation";

// The admin console has no marketing surface of its own — that's the vendor
// side's landing page at `/`. So the segment root goes straight to the
// dashboard, which bounces to /admin/login when signed out.
export default function OperatorHome() {
  redirect("/admin/dashboard");
}
