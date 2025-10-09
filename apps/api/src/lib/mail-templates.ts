// src/lib/mail-templates.ts
const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: #f8faf9;
  margin: 0;
  padding: 0;
  color: #0d1b16;
`;

const CARD_STYLES = `
  max-width: 480px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 10px;
  padding: 32px;
  border: 1px solid #e6eae8;
`;

const BTN_STYLES = `
  background: #105417;
  color: #ffffff !important;
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 6px;
  display: inline-block;
  font-weight: 600;
`;

const FOOTER = `
  <p style="font-size:12px;color:#5d6a65;margin-top:32px;text-align:center">
    You’re receiving this email because you’re using Knwdle.<br/>
    If you didn’t request this, you can safely ignore it.
  </p>
`;

export const MailTemplates = {
  verifyEmail: (link: string) => ({
    subject: 'Verify your email address',
    html: `
      <div style="${BASE_STYLES}">
        <div style="${CARD_STYLES}">
          <h2 style="margin:0 0 16px">Verify your email</h2>
          <p>Please confirm your email address to activate your account.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="${BTN_STYLES}">Verify Email</a>
          </p>
          <p>If the button doesn’t work, copy and paste this link:</p>
          <p><a href="${link}" style="color:#105417">${link}</a></p>
          ${FOOTER}
        </div>
      </div>
    `,
  }),

  otp: (code: string) => ({
    subject: 'Your login code',
    html: `
      <div style="${BASE_STYLES}">
        <div style="${CARD_STYLES}">
          <h2 style="margin:0 0 16px">One-Time Password</h2>
          <p>Use the code below to log in. It expires in <b>10 minutes</b>.</p>
          <div style="margin:24px 0;font-size:22px;font-weight:bold;letter-spacing:3px;text-align:center">
            ${code}
          </div>
          ${FOOTER}
        </div>
      </div>
    `,
  }),

  invite: (link: string, joinCode?: string) => ({
    subject: 'You’ve been invited to join an organisation',
    html: `
      <div style="${BASE_STYLES}">
        <div style="${CARD_STYLES}">
          <h2 style="margin:0 0 16px">You’re Invited!</h2>
          <p>You’ve been invited to join an organisation on <b>Knwdle</b>.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="${BTN_STYLES}">Accept Invite</a>
          </p>
          <p>If the button doesn’t work, copy and paste this link:</p>
          <p><a href="${link}" style="color:#105417">${link}</a></p>

          ${
            joinCode
              ? `<hr style="margin:24px 0;border:none;border-top:1px solid #e6eae8"/>
                 <p>Or use this join code in the app:</p>
                 <div style="margin:12px 0;font-size:18px;font-weight:600;text-align:center;letter-spacing:2px">
                   ${joinCode}
                 </div>`
              : ''
          }

          ${FOOTER}
        </div>
      </div>
    `,
  }),
};
