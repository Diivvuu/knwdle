// src/lib/mail-templates.ts
export const MailTemplates = {
  verifyEmail: (link: string) => ({
    subject: 'Verify your email',
    html: `
      <h2 style="margin:0 0 12px">Confirm your email</h2>
      <p>Click the button below to verify your account.</p>
      <p style="margin:18px 0">
        <a href="${link}" style="background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block">Verify Email</a>
      </p>
      <p>If the button doesn't work, copy and paste this link:</p>
      <p><a href="${link}">${link}</a></p>
    `,
  }),
  otp: (code: string) => ({
    subject: 'Your login code',
    html: `
      <h2 style="margin:0 0 12px">One-Time Password</h2>
      <p>Your code is <b style="font-size:18px;letter-spacing:2px">${code}</b>. It expires in 10 minutes.</p>
    `,
  }),
};
