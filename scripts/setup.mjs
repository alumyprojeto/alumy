// Setup multiplataforma (Windows/Mac/Linux): prepara o arquivo .env antes do banco.
import { existsSync, copyFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (existsSync(".env")) {
  console.log("✓ .env já existe — mantendo o seu.");
} else {
  // Cria .env a partir do exemplo, com um AUTH_SECRET aleatório.
  let conteudo = "";
  if (existsSync(".env.example")) {
    const { readFileSync } = await import("node:fs");
    conteudo = readFileSync(".env.example", "utf8");
  } else {
    conteudo = 'DATABASE_URL="file:./dev.db"\nAUTH_SECRET="trocar"\nSEED_ADMIN_PASSWORD="alumy123"\n';
  }
  const segredo = randomBytes(48).toString("hex");
  conteudo = conteudo.replace(/AUTH_SECRET="[^"]*"/, `AUTH_SECRET="${segredo}"`);
  writeFileSync(".env", conteudo);
  console.log("✓ Arquivo .env criado com um segredo de sessão aleatório.");
}

console.log("✓ Pronto. Em seguida o banco será criado e populado...");
