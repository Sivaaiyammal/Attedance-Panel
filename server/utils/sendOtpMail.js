import nodemailer from 'nodemailer';

export const sendOtpMail = async (email, otp) =>  {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,      // Your Gmail address
      pass: process.env.SMTP_PASS    // App Password (not your Gmail password)
    }
  });

  const mailOptions = {
    from: `"Attendance Panel" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: 'Your OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Your OTP Code</h2>
        <p>Use the OTP below to reset your password:</p>
        <div style="font-size: 24px; font-weight: bold; color: #333;">${otp}</div>
        <p>This code will expire in 5 minutes.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};
