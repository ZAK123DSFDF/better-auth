"use server";
import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  // Mailtrap configuration - use environment variables
  const mailtrapConfig = {
    host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
    port: parseInt(process.env.MAILTRAP_PORT || "2525"),
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  };

  if (!mailtrapConfig.auth.user || !mailtrapConfig.auth.pass) {
    throw new Error("Mailtrap credentials not configured");
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM environment variable is not set");
  }

  const transporter = nodemailer.createTransport(mailtrapConfig);

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to.toLowerCase().trim(),
      subject: subject.trim(),
      text: text.trim(),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      message: "Failed to send email. Please try again later.",
    };
  }
}
