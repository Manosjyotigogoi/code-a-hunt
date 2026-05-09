import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// POST /api/contact — send contact form email
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ error: 'Name, email and message are required.' });

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Email to site owner
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'STAI'}" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      subject: `New Contact from ${name} — STAI`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0D0D0D; padding: 20px 28px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #FFFF66; margin: 0; font-size: 20px;">New Contact Message — STAI</h2>
          </div>
          <div style="background: #fff; border: 2px solid #0D0D0D; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
            <p style="margin: 0 0 12px;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 0 0 12px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 0 0 8px;"><strong>Message:</strong></p>
            <div style="background: #F9F9F9; border-left: 4px solid #FFFF66; padding: 14px 16px; border-radius: 0 8px 8px 0; white-space: pre-wrap;">${message}</div>
          </div>
        </div>
      `,
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'STAI'}" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Thanks for reaching out, ${name}! — STAI`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0D0D0D; padding: 20px 28px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #FFFF66; margin: 0;">Hey ${name}, we got your message! 👋</h2>
          </div>
          <div style="background: #fff; border: 2px solid #0D0D0D; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
            <p>Thanks for reaching out to STAI! We've received your message and will get back to you within 24–48 hours.</p>
            <div style="background: #F9F9F9; border-left: 4px solid #FFB6C1; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; white-space: pre-wrap;"><strong>Your message:</strong><br/><br/>${message}</div>
            <p style="color: #555; font-size: 14px;">— The STAI Team</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

export default router;
