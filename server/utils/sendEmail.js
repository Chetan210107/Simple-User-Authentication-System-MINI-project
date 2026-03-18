const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const { EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS } = process.env;

    if (!EMAIL_SERVICE || !EMAIL_USER || !EMAIL_PASS) {
        throw new Error('Email configuration is missing (EMAIL_SERVICE / EMAIL_USER / EMAIL_PASS)');
    }

    const transporter = nodemailer.createTransport({
        service: EMAIL_SERVICE,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `Quiz App <${EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
