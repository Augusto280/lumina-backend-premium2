import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

// Base simples em memória
let usuarios = [
  {
    nome: "Augusto Cesar",
    email: "teste@lumina.com",
    senha: "123456",
    plano: "mensal",
    validade: "2025-12-12",
    ativo: true
  }
];

// Função de envio de e-mail
async function enviarEmail(email, nome, senha, plano) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Lumina IA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🌸 Seu acesso à Lumina IA foi liberado!",
      html: `
        <h2>Olá, ${nome}!</h2>
        <p>Seu acesso à <strong>Lumina IA</strong> foi liberado com sucesso.</p>
        <p><b>Plano:</b> ${plano}</p>
        <p><b>Usuário:</b> ${email}<br><b>Senha:</b> ${senha}</p>
        <p>Aproveite sua jornada com leveza 💜</p>
        <p>— Equipe Lumina IA</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 E-mail enviado para ${email}`);
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err.message);
  }
}

// Função de envio via Z-API
async function enviarWhatsapp(telefone, nome, plano, email, senha) {
  try {
    if (!process.env.ZAPI_TOKEN || !telefone) return;
    const msg = `
🌸 Olá ${nome}! Seu acesso à Lumina IA foi liberado!
Plano: ${plano}
Usuário: ${email}
Senha: ${senha}
Aproveite sua jornada de leveza 💜
Equipe Lumina IA
`;
    await fetch(
      `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: telefone, message: msg })
      }
    );
    console.log(`💬 Mensagem enviada para ${telefone}`);
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err.message);
  }
}

// Login
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  const usuario = usuarios.find(u => u.email === email && u.senha === senha);
  if (!usuario) return res.status(401).json({ message: "Usuário não encontrado" });
  if (!usuario.ativo) return res.status(403).json({ message: "Assinatura inativa" });
  res.json({ message: "Login bem-sucedido", usuario });
});

// Confirmação de pagamento
app.post("/confirm-payment", async (req, res) => {
  const { nome, email, plano, telefone } = req.body;
  const validade = new Date();
  if (plano === "mensal") validade.setDate(validade.getDate() + 30);
  if (plano === "semestral") validade.setDate(validade.getDate() + 180);
  if (plano === "anual") validade.setDate(validade.getDate() + 365);

  const senha = "123456";
  const existente = usuarios.find(u => u.email === email);
  if (existente) {
    existente.ativo = true;
    existente.plano = plano;
    existente.validade = validade.toISOString().split("T")[0];
  } else {
    usuarios.push({
      nome,
      email,
      senha,
      telefone,
      plano,
      validade: validade.toISOString().split("T")[0],
      ativo: true
    });
  }

  await enviarEmail(email, nome, senha, plano);
  await enviarWhatsapp(telefone, nome, plano, email, senha);

  res.json({
    status: "success",
    message: "Usuário ativado e mensagens enviadas",
    validade: validade.toISOString().split("T")[0]
  });
});

app.get("/", (req, res) => res.send("🌸 Lumina IA Premium Backend ativo 🚀"));
app.listen(10000, () => console.log("Servidor rodando na porta 10000"));
