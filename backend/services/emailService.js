import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// เปลี่ยนพารามิเตอร์ตัวที่ 3 จาก textContent เป็น htmlContent
export const sendNotificationEmail = async (toEmail, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: `"CEiVoice Support" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent // เปลี่ยนจาก text เป็น html
        });
        console.log(`✅ Email sent to: ${toEmail}`);
    } catch (error) {
        console.error(`❌ Email failed:`, error.message);
    }
};