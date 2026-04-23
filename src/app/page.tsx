import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}

// Prevent static generation for this route
export const dynamic = "force-dynamic";
