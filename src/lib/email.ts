import nodemailer from 'nodemailer';

// Store transport globally in dev so we don't recreate it on every hot-reload
let transporter: any = null;

export async function sendQAReportEmail(
  toEmail: string,
  subject: string,
  reportContent: string
): Promise<boolean> {
  const userEmail = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  if (!userEmail || !appPassword) {
    console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables.');
    return false;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail', // Defaults to Gmail (simple). Change if using Outlook, etc.
      auth: {
        user: userEmail,
        pass: appPassword,
      },
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"Silent QA Bot" <${userEmail}>`,
      to: toEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #0070f3;">QA Defect Report Generated</h2>
          <p>A new automated defect report has been flagged by the Silent QA Extension.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; white-space: pre-wrap;">
            ${reportContent.replace(/\n/g, '<br/>')}
          </div>
          
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">
            This is an automated message from your Silent Backend QA Dashboard.<br/>
            Hash Signature (SHA-256): <i>Pending Generation</i>
          </p>
        </div>
      `,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
