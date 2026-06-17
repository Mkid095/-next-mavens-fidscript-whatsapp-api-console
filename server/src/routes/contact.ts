import { Router, Request, Response } from 'express';
import { resend, MAIL_FROM } from '../utils/resend.js';

const router = Router();

// POST /api/contact — Contact form submission
router.post('/', async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  // Send to Next Mavens
  if (resend) {
    try {
      await resend.emails.send({
        from: MAIL_FROM,
        to: 'info@nextmavens.com',
        replyTo: email,
        subject: `[FIDScript Contact] ${subject || 'New message'} — from ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #181711; border-bottom: 2px solid #eab308; padding-bottom: 8px;">
              New Contact Form Submission
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; color: #181711;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; color: #181711;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Subject:</strong></td>
                <td style="padding: 8px 0; color: #181711;">${subject || '(No subject)'}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding: 16px; background: #f9f9f2; border-radius: 8px; border-left: 4px solid #eab308;">
              <p style="margin: 0; color: #333; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `,
        text: `New contact form submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject || '(No subject)'}\n\nMessage:\n${message}`,
      });
    } catch (err) {
      console.error('[contact] Failed to send contact email:', err);
      return res.status(500).json({ success: false, error: 'Failed to send message. Please try again.' });
    }
  }

  // Auto-reply to the user
  if (resend) {
    try {
      await resend.emails.send({
        from: MAIL_FROM,
        to: email,
        subject: 'We received your message — Next Mavens',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #181711; padding: 24px; text-align: center;">
              <img src="https://whatsapp.fidscript.com/logo.png" alt="FIDScript" style="height: 40px; margin-bottom: 12px;" onerror="this.style.display='none'">
              <h1 style="color: #eab308; font-size: 20px; margin: 0;">FIDScript by Next Mavens</h1>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #181711; margin-top: 0;">Hi ${name},</h2>
              <p style="color: #444; line-height: 1.6;">
                Thank you for reaching out. We've received your message and will get back to you within <strong>1–2 business days</strong>.
              </p>
              <p style="color: #444; line-height: 1.6;">
                Here's a summary of what you submitted:
              </p>
              <div style="padding: 16px; background: #f9f9f2; border-radius: 8px; border-left: 4px solid #eab308; margin: 20px 0;">
                <p style="margin: 0 0 8px; color: #666; font-size: 13px;"><strong>Subject:</strong> ${subject || '(No subject)'}</p>
                <p style="margin: 0; color: #333; white-space: pre-wrap; font-size: 14px;">${message}</p>
              </div>
              <p style="color: #444; line-height: 1.6;">
                In the meantime, feel free to explore our documentation at
                <a href="https://whatsapp.fidscript.com/docs" style="color: #eab308;">whatsapp.fidscript.com/docs</a>.
              </p>
              <hr style="border: none; border-top: 1px solid #eaebe4; margin: 24px 0;">
              <p style="color: #888; font-size: 13px; margin: 0;">
                Next Mavens<br>
                WhatsApp API for Kenyan Businesses<br>
                <a href="tel:+254746269657" style="color: #888;">+254 746 269 657</a><br>
                <a href="mailto:info@nextmavens.com" style="color: #888;">info@nextmavens.com</a>
              </p>
            </div>
          </div>
        `,
        text: `Hi ${name},\n\nThank you for reaching out. We've received your message and will get back to you within 1–2 business days.\n\nSummary of your message:\nSubject: ${subject || '(No subject)'}\n\n${message}\n\nIn the meantime, feel free to explore our documentation at whatsapp.fidscript.com/docs.\n\nNext Mavens\nWhatsApp API for Kenyan Businesses\n+254 746 269 657\ninfo@nextmavens.com`,
      });
    } catch (err) {
      console.error('[contact] Auto-reply failed:', err);
      // Non-fatal — the main email already sent
    }
  }

  return res.json({ success: true, data: { message: 'Your message has been sent. We\'ll be in touch shortly.' } });
});

export default router;
