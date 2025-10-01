/**
 * Email Templates for Asipiya Pawning System
 * All email templates are centralized here for easy maintenance
 */

/**
 * Generate password reset email  template
 * @param {string} userName - User's full name
 * @param {string} resetLink - Password reset link
 * @returns {string} - HTML email template
 */
export const passwordResetEmailTemplate = (userName, resetLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header { 
                background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 300;
            }
            .content { 
                background-color: white; 
                padding: 30px; 
            }
            .button { 
                display: inline-block; 
                padding: 15px 30px; 
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                color: white; 
                text-decoration: none; 
                border-radius: 25px; 
                margin: 20px 0;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            .button:hover { 
                background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
            }
            .footer { 
                text-align: center; 
                margin-top: 20px; 
                color: #666; 
                font-size: 12px; 
                background-color: #f8f9fa;
                padding: 20px;
            }
            .warning { 
                background-color: #fff3cd; 
                border-left: 4px solid #ffc107;
                color: #856404; 
                padding: 15px; 
                border-radius: 5px; 
                margin: 20px 0; 
            }
            .link-box {
                word-break: break-all; 
                background-color: #e9ecef; 
                padding: 15px; 
                border-radius: 5px;
                border: 1px solid #dee2e6;
                font-family: monospace;
                font-size: 12px;
            }
            .highlight {
                color: #2c3e50;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Asipiya Pawning System</p>
            </div>
            <div class="content">
                <p>Hello <span class="highlight">${userName}</span>,</p>
                <p>We received a request to reset your password for your Asipiya Pawning System account.</p>
                <p>If you requested this password reset, please click the button below to set a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" class="button">Reset My Password</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Information:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>This link will expire in <strong>1 hour</strong> for security reasons</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Never share this link with anyone</li>
                        <li>Our team will never ask for your password via email</li>
                    </ul>
                </div>
                
                <p><strong>Alternative Access:</strong></p>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <div class="link-box">
                    ${resetLink}
                </div>
                
                <p style="margin-top: 30px;">If you have any questions or concerns, please contact our support team immediately.</p>
                
                <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>Asipiya Pawning System Team</strong>
                </p>
            </div>
            <div class="footer">
                <p><strong>This is an automated message. Please do not reply to this email.</strong></p>
                <p>© ${new Date().getFullYear()} Asipiya Pawning System. All rights reserved.</p>
                <p style="margin-top: 10px; font-size: 11px; color: #999;">
                    This email was sent because a password reset was requested for your account.
                    If you did not request this, please contact support immediately.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Welcome email template for new users
 * @param {string} userName - User's full name
 * @param {string} loginLink - Link to login page
 * @returns {string} - HTML email template
 */
export const welcomeEmailTemplate = (userName, loginLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Asipiya Pawning System</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header { 
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 300;
            }
            .content { 
                background-color: white; 
                padding: 30px; 
            }
            .button { 
                display: inline-block; 
                padding: 15px 30px; 
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                color: white; 
                text-decoration: none; 
                border-radius: 25px; 
                margin: 20px 0;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            .footer { 
                text-align: center; 
                margin-top: 20px; 
                color: #666; 
                font-size: 12px; 
                background-color: #f8f9fa;
                padding: 20px;
            }
            .highlight {
                color: #27ae60;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to Asipiya Pawning System!</h1>
            </div>
            <div class="content">
                <p>Dear <span class="highlight">${userName}</span>,</p>
                <p>Welcome to the Asipiya Pawning System! Your account has been successfully created.</p>
                <p>You can now access the system and reset your password to manage operations.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginLink}" class="button">Access System</a>
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>Asipiya Pawning System Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} Asipiya Pawning System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Generate password reset success email HTML template
 * @param {string} userName - User's full name
 * @param {string} loginLink - Link to login page
 * @returns {string} - HTML email template
 */
export const passwordResetSuccessEmailTemplate = (userName, loginLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header { 
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 300;
            }
            .content { 
                background-color: white; 
                padding: 30px; 
            }
            .button { 
                display: inline-block; 
                padding: 15px 30px; 
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                color: white; 
                text-decoration: none; 
                border-radius: 25px; 
                margin: 20px 0;
                font-weight: bold;
                transition: all 0.3s ease;
            }
            .button:hover { 
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(39, 174, 96, 0.4);
            }
            .footer { 
                text-align: center; 
                margin-top: 20px; 
                color: #666; 
                font-size: 12px; 
                background-color: #f8f9fa;
                padding: 20px;
            }
            .success-icon {
                text-align: center;
                margin: 20px 0;
                font-size: 48px;
            }
            .highlight {
                color: #27ae60;
                font-weight: bold;
            }
            .info-box {
                background-color: #d4edda;
                border-left: 4px solid #27ae60;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .security-tips {
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 5px;
                padding: 20px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Password Reset Successful</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Asipiya Pawning System</p>
            </div>
            <div class="content">
                <div class="success-icon">
                    🎉
                </div>
                
                <p>Hello <span class="highlight">${userName}</span>,</p>
                
                <div class="info-box">
                    <strong>✅ Great news!</strong> Your password has been successfully reset and updated in our system.
                </div>
                
                <p>Your account is now secure with your new password. You can immediately log in to access the Asipiya Pawning System with your updated credentials.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginLink}" class="button">Login to Your Account</a>
                </div>
                
                <div class="security-tips">
                    <h3 style="margin-top: 0; color: #2c3e50;">🔐 Security Tips:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li><strong>Keep your password secure</strong> - Don't share it with anyone</li>
                        <li><strong>Use unique passwords</strong> - Don't use this password for other accounts</li>
                        <li><strong>Log out when finished</strong> - Always log out from shared devices</li>
                        <li><strong>Monitor your account</strong> - Report any suspicious activity immediately</li>
                    </ul>
                </div>
                
                <p><strong>Important:</strong> If you did not reset your password, please contact our support team immediately as this could indicate unauthorized access to your account.</p>
                
                <p>For any questions or security concerns, please contact our support team right away.</p>
                
                <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>Asipiya Pawning System Security Team</strong>
                </p>
            </div>
            <div class="footer">
                <p><strong>This is an automated security notification.</strong></p>
                <p>© ${new Date().getFullYear()} Asipiya Pawning System. All rights reserved.</p>
                <p style="margin-top: 10px; font-size: 11px; color: #999;">
                    This email was sent because your password was successfully changed.
                    If this wasn't you, please contact support immediately.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};
