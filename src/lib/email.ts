import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    // Gmail App Passwords may include spaces - remove them
    pass: (process.env.EMAIL_PASS || '').replace(/\s/g, ''),
  },
});

export async function sendVerificationEmail(email: string, name: string, code: string) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  
  await transporter.sendMail({
    from: `"Dena-Paona 💰" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Dena-Paona Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #0f172a; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
          .body { padding: 32px; }
          .body p { color: #94a3b8; line-height: 1.6; }
          .code-box { background: #0f172a; border: 2px solid #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .code { font-size: 36px; font-weight: bold; color: #6366f1; letter-spacing: 8px; font-family: monospace; }
          .footer { padding: 20px 32px; border-top: 1px solid #334155; text-align: center; }
          .footer p { color: #475569; font-size: 12px; margin: 0; }
          .warning { background: #1e1b4b; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 4px; margin-top: 16px; }
          .warning p { color: #a5b4fc; font-size: 13px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Dena-Paona</h1>
            <p>Your Personal Finance Ledger</p>
          </div>
          <div class="body">
            <p>Hello <strong style="color: #e2e8f0;">${name}</strong>,</p>
            <p>Welcome to Dena-Paona! Please verify your email address using the code below:</p>
            <div class="code-box">
              <div class="code">${code}</div>
              <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">Valid for 15 minutes</p>
            </div>
            <div class="warning">
              <p>⚠️ Never share this code with anyone. Dena-Paona staff will never ask for it.</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Dena-Paona. All rights reserved.</p>
            <p style="margin-top: 8px;">If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendTransactionNotification(
  toEmail: string,
  toName: string,
  fromName: string,
  type: 'created' | 'updated' | 'cleared',
  transactionType: 'dena' | 'paona',
  amount: number,
  remainingAmount?: number,
  notes?: string
) {
  const isDebtor = transactionType === 'dena'; // person owes money to fromName
  
  let subject = '';
  let message = '';
  let color = '';

  if (type === 'created') {
    subject = `New Transaction: ${fromName} added you to their ledger`;
    message = isDebtor
      ? `<strong>${fromName}</strong> has added you to their <span style="color: #f43f5e;">Paona (Receivable)</span> list. You owe them <strong>৳${amount.toLocaleString()}</strong>.`
      : `<strong>${fromName}</strong> has recorded that they owe you <strong>৳${amount.toLocaleString()}</strong> in their <span style="color: #10b981;">Dena (Payable)</span> list.`;
    color = isDebtor ? '#f43f5e' : '#10b981';
  } else if (type === 'updated') {
    subject = `Transaction Updated: ${fromName} updated your balance`;
    message = `Your transaction with <strong>${fromName}</strong> has been updated. Remaining balance: <strong>৳${(remainingAmount || 0).toLocaleString()}</strong>.`;
    color = '#f59e0b';
  } else {
    subject = `Transaction Cleared: Balance with ${fromName} settled!`;
    message = `Your debt/credit with <strong>${fromName}</strong> has been fully cleared! 🎉`;
    color = '#10b981';
  }

  await transporter.sendMail({
    from: `"Dena-Paona 💰" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #0f172a; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, ${color}88, ${color}); padding: 32px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .body { padding: 32px; }
          .body p { color: #94a3b8; line-height: 1.6; }
          .amount-box { background: #0f172a; border: 2px solid ${color}; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
          .amount { font-size: 32px; font-weight: bold; color: ${color}; }
          .footer { padding: 20px 32px; border-top: 1px solid #334155; text-align: center; }
          .footer p { color: #475569; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Dena-Paona Transaction ${type === 'created' ? 'Alert' : type === 'updated' ? 'Update' : 'Cleared'}</h1>
          </div>
          <div class="body">
            <p>Hello <strong style="color: #e2e8f0;">${toName}</strong>,</p>
            <p>${message}</p>
            ${notes ? `<p style="color: #64748b; font-style: italic;">Note: "${notes}"</p>` : ''}
            <div class="amount-box">
              <div class="amount">৳${amount.toLocaleString()}</div>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Transaction Amount</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Dena-Paona. All rights reserved.</p>
            <p style="margin-top: 8px;">Login to view full transaction details.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, code: string) {
  await transporter.sendMail({
    from: `"Dena-Paona 💰" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset - Dena-Paona',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #0f172a; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .body { padding: 32px; }
          .body p { color: #94a3b8; line-height: 1.6; }
          .code-box { background: #0f172a; border: 2px solid #ef4444; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .code { font-size: 36px; font-weight: bold; color: #ef4444; letter-spacing: 8px; font-family: monospace; }
          .footer { padding: 20px 32px; border-top: 1px solid #334155; text-align: center; }
          .footer p { color: #475569; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="body">
            <p>Hello <strong style="color: #e2e8f0;">${name}</strong>,</p>
            <p>Use the code below to reset your password. Valid for 15 minutes.</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p style="color: #64748b; font-size: 13px;">If you didn't request this, ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Dena-Paona. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
