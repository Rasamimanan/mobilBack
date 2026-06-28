const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function genererCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function envoyerCodeValidation(destinataire, nomComplet, code) {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"Suivi Chantier" <${process.env.SMTP_USER}>`,
    to: destinataire,
    subject: 'Confirmation de votre adresse email - Suivi Chantier',
    text: `Bonjour ${nomComplet},\n\nVoici votre code de validation : ${code}\n\nSaisissez ce code dans l'application pour confirmer votre adresse email.\nVotre compte sera ensuite soumis à la validation d'un administrateur avant de pouvoir vous connecter.\n\nCe code est personnel, ne le partagez avec personne.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#2563eb;">Suivi Chantier</h2>
        <p>Bonjour <strong>${nomComplet}</strong>,</p>
        <p>Voici votre code de validation pour confirmer votre adresse email :</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; background:#eff6ff; color:#2563eb; padding: 14px 20px; text-align:center; border-radius: 10px; margin: 20px 0;">
          ${code}
        </div>
        <p>Saisissez ce code dans l'application pour confirmer votre adresse email.</p>
        <p>Votre compte sera ensuite soumis à la <strong>validation d'un administrateur</strong> avant que vous puissiez vous connecter.</p>
        <p style="color:#888; font-size: 12px; margin-top: 30px;">Ce code est personnel, ne le partagez avec personne.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { transporter, genererCode, envoyerCodeValidation };