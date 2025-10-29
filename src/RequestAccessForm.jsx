
import React, { useState } from "react";

export function RequestAccessForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e) => {
    e.preventDefault();
    alert(`Request sent! We'll get back to ${email}.`);
    setName("");
    setEmail("");
    setMessage("");
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
        <button
          type="submit"
          className="w-full bg-amber-600 hover:bg-amber-700 rounded-lg py-3 font-semibold text-white transition"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
