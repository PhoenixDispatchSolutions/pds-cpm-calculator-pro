import React, { useState } from "react";

/**
 * Simple Request Access form
 * - Keeps your UI look/feel
 * - You can later wire EmailJS here by replacing the alert() with emailjs.send(...)
 */
export function RequestAccessForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const submit = async (e) => {
    e.preventDefault();
    try {
      setStatus("sending");
      // TODO: plug EmailJS here if/when you want:
      // const emailjs = await import("@emailjs/browser");
      // await emailjs.init({ publicKey: "YOUR_PUBLIC_KEY" });
      // await emailjs.send("SERVICE_ID", "TEMPLATE_ID", { name, email, message });
      await new Promise((r) => setTimeout(r, 400)); // simulate latency
      setStatus("sent");
      setName(""); setEmail(""); setMessage("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
      <h3 className="font-semibold mb-2 text-lg">Request Access Link</h3>
      <p className="text-sm text-neutral-400 mb-4">
        Enter your details and we’ll email your dispatcher a new access code.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <textarea
          className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"
          placeholder="Message or dispatcher info"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 rounded-lg px-4 py-3 font-semibold text-white transition"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending…" : "Submit Request"}
          </button>
          {status === "sent" && <span className="text-green-400 text-sm">Sent!</span>}
          {status === "error" && <span className="text-red-400 text-sm">Error sending.</span>}
        </div>
      </form>
    </div>
  );
}
