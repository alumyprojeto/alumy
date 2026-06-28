import { SignJWT } from "jose";
import { writeFileSync } from "fs";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-troque-em-producao-7c5bd9-alumy-pcp-1e2a44-aleatorio"
);

(async () => {
  const token = await new SignJWT({
    id: 1,
    username: "nayla",
    nome: "Nayla",
    isAdmin: true,
    setores: ["gestao", "vendas"],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  writeFileSync("/tmp/cookie.txt", token);
  console.log("cookie gerado:", token.slice(0, 20) + "...");
})();
