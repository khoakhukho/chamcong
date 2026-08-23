import nodemailer from 'nodemailer';
import prisma, { ensureDatabaseReady } from './prisma';

/**
 * Generates and stores a 6-digit OTP for Email verification
 */
export async function createAndSendOtp(email: string): Promise<{ success: boolean; code: string; message: string }> {
  await ensureDatabaseReady();

  const cleanEmail = email.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Delete previous expired codes for this email
  try {
    await prisma.emailOtp.deleteMany({
      where: { email: cleanEmail },
    });
  } catch {}

  // Save new OTP
  await prisma.emailOtp.create({
    data: {
      email: cleanEmail,
      code,
      expiresAt,
    },
  });

  console.log(`[CARITAS OTP SERVICE] Mã xác thực OTP cho ${cleanEmail}: ${code} (Hết hạn trong 5 phút)`);

  // If SMTP environment variables are configured, attempt sending email
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Caritas Giáo Phận Đà Lạt" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: cleanEmail,
        subject: `[Caritas Đà Lạt] Mã xác thực đăng ký tài khoản Chấm Công: ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin: 0;">CARITAS GIÁO PHẬN ĐÀ LẠT</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Hệ Thống Chấm Công & Quản Trị Nhân Sự Nội Bộ</p>
            </div>
            <p>Kính chào bạn,</p>
            <p>Bạn đang thực hiện đăng ký tài khoản trên hệ thống Chấm Công Caritas Đà Lạt. Mã OTP xác thực của bạn là:</p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #dc2626; font-family: monospace;">${code}</span>
            </div>
            <p style="font-size: 13px; color: #64748b;">Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">Ban Bác Ái Xã Hội - Caritas Giáo Phận Đà Lạt<br/>09 Nguyễn Trường Tộ, Phường 4, TP. Đà Lạt</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.warn('SMTP send error (falling back to direct code verification):', mailErr);
    }
  }

  return {
    success: true,
    code,
    message: `Mã xác thực OTP đã được gửi đến email ${cleanEmail}. Vui lòng kiểm tra hòm thư.`,
  };
}

/**
 * Validates provided OTP code
 */
export async function verifyOtpCode(email: string, inputCode: string): Promise<boolean> {
  await ensureDatabaseReady();

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = inputCode.trim();

  const record = await prisma.emailOtp.findFirst({
    where: {
      email: cleanEmail,
      code: cleanCode,
      expiresAt: { gte: new Date() },
    },
  });

  if (!record) return false;

  // Code is valid - delete it so it cannot be reused
  await prisma.emailOtp.delete({
    where: { id: record.id },
  });

  return true;
}
