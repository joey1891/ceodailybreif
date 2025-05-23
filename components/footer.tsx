"use client";

import Link from "next/link";
import { Building2, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="container max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">CEO Daily Brief</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                서울시 송파구 송파대로
              </p>
              {/* <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                02-123-4567
              </p> */}
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:wjshin2450@gmail.com">wjshin2450@gmail.com</a>
              </p>
            </div>
          </div>

          {/* Quick Links
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link href="/industry" className="hover:underline">Industry</Link>
              <Link href="/policy" className="hover:underline">Policy</Link>
              <Link href="/company" className="hover:underline">Company</Link>
              <Link href="/report" className="hover:underline">Reports</Link>
              <Link href="/schedule" className="hover:underline">Schedule</Link>
              <Link href="/people" className="hover:underline">People</Link>
            </div>
          </div> */}

          {/* Newsletter */}
          {/* <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter for the latest healthcare industry updates.
            </p>
            <form 
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = new FormData(form).get("email") as string;
                
                if (!email || !email.includes("@")) {
                  toast.error("Please enter a valid email address");
                  return;
                }
                
                try {
                  const response = await fetch("/api/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  
                  if (!response.ok) throw new Error("Failed to subscribe");
                  
                  toast.success("Successfully subscribed to the newsletter!");
                  form.reset();
                } catch (error) {
                  console.error("Subscribe error:", error);
                  toast.error("Failed to subscribe. Please try again later.");
                }
              }}
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 text-sm rounded-md border"
                required
              />
              <button 
                type="submit"
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Subscribe
              </button>
            </form>
          </div> */}
        </div>

        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Healthcare Industry Blog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
