"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(result.message || "Não foi possível entrar agora.");
        return;
      }

      const requestedPath = searchParams.get("from");
      const destination = requestedPath?.startsWith("/admin")
        ? requestedPath
        : "/admin";
      router.replace(destination);
      router.refresh();
    } catch {
      setMessage("Não foi possível conectar. Tente novamente em instantes.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
      <label>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
          Senha de administrador
        </span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          className="mt-3 min-h-12 w-full rounded-md border border-gold/25 bg-black/70 px-4 text-white outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/15"
          placeholder="Digite sua senha"
        />
      </label>
      {message ? (
        <p role="alert" className="rounded-md border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        className="min-h-12 rounded-md bg-gold px-5 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
