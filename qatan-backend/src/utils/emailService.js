import nodemailer from "nodemailer";

// Create Transport for verification emails
const verificationTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.VERIFICATION_EMAIL_USER,
    pass: process.env.VERIFICATION_EMAIL_PASS,
  },
});

// Create Transport for instructor applications
const instructorTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.INSTRUCTOR_EMAIL_USER,
    pass: process.env.INSTRUCTOR_EMAIL_PASS,
  },
});

// Send verification code email
export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.VERIFICATION_EMAIL_USER,
    to: email,
    subject: "Verify Your Email - Qatan",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Qatan!</h2>
        <p>Please verify your email address by entering the following code:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await verificationTransport.sendMail(mailOptions);
    console.log("✅ Verification email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw error;
  }
};

// Send instructor approval email with passkey
export const sendInstructorApprovalEmail = async (email, name, passkey) => {
  const mailOptions = {
    from: process.env.INSTRUCTOR_EMAIL_USER,
    to: email,
    subject: "Welcome to Qatan - Instructor Application Approved!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations, ${name}!</h2>
        <p>Your instructor application has been approved. Welcome to the Qatan team!</p>
        <p>Your instructor passkey is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #28a745; font-size: 32px; margin: 0; letter-spacing: 5px;">${passkey}</h1>
        </div>
        <p>Please use this passkey to complete your instructor registration on our platform.</p>
        <p>Best regards,<br>The Qatan Team</p>
      </div>
    `,
  };

  try {
    await instructorTransport.sendMail(mailOptions);
    console.log("✅ Instructor approval email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending instructor approval email:", error);
    throw error;
  }
};

// Send instructor rejection email
export const sendInstructorRejectionEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.INSTRUCTOR_EMAIL_USER,
    to: email,
    subject: "Qatan Instructor Application Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Dear ${name},</h2>
        <p>Thank you for your interest in becoming an instructor with Qatan.</p>
        <p>After careful review of your application, we regret to inform you that we are unable to approve your application at this time.</p>
        <p>We appreciate your interest and encourage you to apply again in the future.</p>
        <p>Best regards,<br>The Qatan Team</p>
      </div>
    `,
  };

  try {
    await instructorTransport.sendMail(mailOptions);
    console.log("✅ Instructor rejection email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending instructor rejection email:", error);
    throw error;
  }
};

// Send course rejection email
export const sendCourseRejectionEmail = async (email, instructorName, courseTitle) => {
  const mailOptions = {
    from: process.env.INSTRUCTOR_EMAIL_USER,
    to: email,
    subject: "Qatan Course Submission Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Dear ${instructorName},</h2>
        <p>Thank you for submitting your course "${courseTitle}" for review on Qatan.</p>
        <p>After careful review, we regret to inform you that we are unable to approve this course at this time.</p>
        <p>You can edit and resubmit your course for approval. We encourage you to review our course guidelines and make any necessary improvements.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Qatan Team</p>
      </div>
    `,
  };

  try {
    await instructorTransport.sendMail(mailOptions);
    console.log("✅ Course rejection email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending course rejection email:", error);
    throw error;
  }
};

// Send admin-created user notification email
export const sendAdminCreatedUserEmail = async (email, name, role, password) => {
  const mailOptions = {
    from: process.env.INSTRUCTOR_EMAIL_USER,
    to: email,
    subject: "Welcome to Qatan - Your Account Has Been Created",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Qatan, ${name}!</h2>
        <p>Your account has been created by an administrator. You have been added as an <strong>${role}</strong> on the Qatan e-learning platform.</p>
        <p>Here are your login credentials:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>Please log in to your account and change your password immediately for security reasons.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The Qatan Team</p>
      </div>
    `,
  };

  try {
    await instructorTransport.sendMail(mailOptions);
    console.log("✅ Admin-created user email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending admin-created user email:", error);
    throw error;
  }
};

// Send password reset OTP email
export const sendPasswordResetEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.VERIFICATION_EMAIL_USER,
    to: email,
    subject: "Password Reset Code - Qatan",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Code</h2>
        <p>You have requested to reset your password for your Qatan account. Use the following code to reset your password:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <p>Best regards,<br>The Qatan Team</p>
      </div>
    `,
  };

  try {
    await verificationTransport.sendMail(mailOptions);
    console.log("✅ Password reset OTP email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending password reset OTP email:", error);
    throw error;
  }
};

