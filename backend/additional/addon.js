// const twilio = require('twilio');
const nodemailer = require('nodemailer');

// utils/responseHelper.js
const path = require("path");
const fs = require("fs");
// Success response
module.exports = {
  sendSuccess: async (res, statusCode, message, data = null) => {
    const response = {
      message: message || 'Request successful.',
      data: data || null
    };

    res.status(statusCode).json(response);
  },

  // Error response
  sendError: async (res, statusCode, message,issue="") => {
    // console.log(res, statusCode, message)
    const response = {
      message: message || null,
      issue:issue
    };

    res.status(statusCode).json(response);
  },

  // Unauthorized response
  sendUnauthorized: async (res, message = 'Unauthorized access.') => {
    const response = {
      message: message
    };

    res.status(401).json(response);
  },

  // Forbidden response
  sendForbidden: async (res, message = 'Forbidden access.') => {
    const response = {
      message: message
    };

    res.status(403).json(response);
  },

   sendEmail: async (recipientEmail, subject, htmlContent) => {
    try {
      // Create a transporter object
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER, // Use environment variable for email
          pass: process.env.EMAIL_PASS, // Use environment variable for password
        },
      });

      // Email options
      const mailOptions = {
        from: process.env.EMAIL_USER, // Sender address
        to: recipientEmail,          // Receiver's email
        subject: subject,            // Subject line
        html: htmlContent,           // HTML body
      };

      // Send the email
      let otpFunctions = process.env.OTPFUNCTIONS
      let info
      if (otpFunctions == 'false') {
        console.log("under false otpfunctions")

        info = {
          accepted: ['testingvishal@yopmail.com'],
          rejected: [],
          ehlo: [
            'SIZE 35882577',
            '8BITMIME',
            'AUTH LOGIN PLAIN XOAUTH2 PLAIN-CLIENTTOKEN OAUTHBEARER XOAUTH',
            'ENHANCEDSTATUSCODES',
            'PIPELINING',
            'CHUNKING',
            'SMTPUTF8'
          ],
          envelopeTime: 925,
          messageTime: 804,
          messageSize: 4844,
          response: '250 2.0.0 OK  1734360289 d2e1a72fcca58-72918ac5264sm5009996b3a.21 - gsmtp',
          envelope: {
            from: 'sjblogs2023@gmail.com',
            to: ['testingvishal@yopmail.com']
          },
          messageId: '<46ba229f-a7ac-fc10-d1e1-4dc99032ec93@gmail.com>'
        }
      }
      else {
        console.log("under true  otpfunctions")
        info = await transporter.sendMail(mailOptions);
      }





      console.log(`Email sent: ${info.response}`);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error; // Rethrow the error to be handled by the caller
    }
  },

  validateFields: async (reqBody, requiredFields, nonRequiredFields, res) => {
    // Check required fields
    for (let field of requiredFields) {
      if (!reqBody[field] || reqBody[field] === '') {
        res.status(400).json({
          message: `${field} is required`
        });
        return false; // Validation failed, send response and stop further execution
      }
    }

    // Check non-required fields (if they exist and are empty)
    for (let field of nonRequiredFields) {
      if (reqBody[field] === '') {
        res.status(400).json({
          message: `${field} cannot be empty if provided`
        });
        return false; // Validation failed, send response and stop further execution
      }
    }

    return true; // All validations passed
  },


  uploadFile: async (file, folderPath, res) => {
    try {
      // Ensure the directory exists
      const dir = path.join(__dirname, "../", folderPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const fileName = file.name === 'sitemap.xml' ? 'sitemap.xml' : `${Date.now()}_${file.name}`;
      const filePath = path.join(dir, fileName);
      

      // Check if the file is an image or video
      if (!file.mimetype.startsWith('image') && !file.mimetype.startsWith('video') && file.mimetype !== 'application/xml' && file.mimetype !== 'text/xml') {
        throw new Error("File type is not supported. Only image, video, xml files are allowed.");
      }

      // Handle different file input types
      let buffer;

      // Case 1: Direct buffer provided (NEW - simplest approach)
      if (file.buffer && Buffer.isBuffer(file.buffer)) {
        buffer = file.buffer;
      }
      // Case 2: File from multipart form-data (tempFilePath)
      else if (file.tempFilePath) {
        buffer = await fs.promises.readFile(file.tempFilePath);
        // Clean up temp file after reading
        try {
          await fs.promises.unlink(file.tempFilePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      // Case 3: Stream (for backward compatibility)
      else if (file.stream) {
        // Collect stream data into buffer
        const chunks = [];
        for await (const chunk of file.stream) {
          chunks.push(chunk);
        }
        buffer = Buffer.concat(chunks);
      }
      else {
        throw new Error('No valid file buffer, tempFilePath, or stream found.');
      }

      // Verify buffer has data
      if (!buffer || buffer.length === 0) {
        throw new Error('File buffer is empty');
      }

      // Write file directly to disk using fs.promises.writeFile (simple and reliable)
      await fs.promises.writeFile(filePath, buffer);

      // Verify file was written successfully
      if (!fs.existsSync(filePath)) {
        throw new Error('File was not written to disk');
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('File was written but is empty');
      }

      // Final verification - file must exist before returning
      if (!fs.existsSync(filePath)) {
        throw new Error('File verification failed - file does not exist after write');
      }
      
      return fileName;

    } catch (err) {
      console.error(`[uploadFile] Error saving file`, err?.message || err);
      throw new Error(`Failed to upload file: ${err.message}`);
    }
  },



  //FUTURE USE 


  // twilioText: async (message, to) => {
  //   try {
  //     // Retrieve environment variables
  //     const accountSid = process.env.TWILIO_ACCOUNT_SID;
  //     const authToken = process.env.TWILIO_AUTH_TOKEN;
  //     const from = process.env.TWILIO_PHONE_NUMBER;

  //     // Validate Twilio credentials
  //     if (!accountSid || !authToken || !from) {
  //       throw new Error("Twilio credentials are missing. Please check your environment variables.");
  //     }

  //     // Initialize Twilio client
  //     const client = new twilio(accountSid, authToken);

  //     // Send SMS
  //     let messageResponse

  //     let otpFunctions = process.env.OTPFUNCTIONS

  //     if (otpFunctions == 'false') {
  //       console.log("under false otpfunctions")

  //       messageResponse = {
  //         sid: "afsddf332d"
  //       }
  //     }
  //     else {
  //       console.log("under true  otpfunctions")


  //       messageResponse = await client.messages.create({
  //         body: message,
  //         from: from,
  //         to: to,
  //       });
  //     }

  //     console.log('Message sent with SID:', messageResponse.sid);
  //     return { success: true, messageSid: messageResponse.sid };
  //   } catch (error) {
  //     console.error('Error sending SMS:', error);
  //     throw new Error(error.message || "Failed to send SMS");
  //   }
  // },

  // sendEmail: async (recipientEmail, subject, htmlContent) => {
  //   try {
  //     // Create a transporter object
  //     const transporter = nodemailer.createTransport({
  //       host: "smtp.gmail.com",
  //       port: 465,
  //       secure: true, // true for 465, false for other ports
  //       auth: {
  //         user: process.env.EMAIL_USER, // Use environment variable for email
  //         pass: process.env.EMAIL_PASS, // Use environment variable for password
  //       },
  //     });

  //     // Email options
  //     const mailOptions = {
  //       from: process.env.EMAIL_USER, // Sender address
  //       to: recipientEmail,          // Receiver's email
  //       subject: subject,            // Subject line
  //       html: htmlContent,           // HTML body
  //     };

  //     // Send the email
  //     let otpFunctions = process.env.OTPFUNCTIONS
  //     let info
  //     if (otpFunctions == 'false') {
  //       console.log("under false otpfunctions")

  //       info = {
  //         accepted: ['testingvishal@yopmail.com'],
  //         rejected: [],
  //         ehlo: [
  //           'SIZE 35882577',
  //           '8BITMIME',
  //           'AUTH LOGIN PLAIN XOAUTH2 PLAIN-CLIENTTOKEN OAUTHBEARER XOAUTH',
  //           'ENHANCEDSTATUSCODES',
  //           'PIPELINING',
  //           'CHUNKING',
  //           'SMTPUTF8'
  //         ],
  //         envelopeTime: 925,
  //         messageTime: 804,
  //         messageSize: 4844,
  //         response: '250 2.0.0 OK  1734360289 d2e1a72fcca58-72918ac5264sm5009996b3a.21 - gsmtp',
  //         envelope: {
  //           from: 'sjblogs2023@gmail.com',
  //           to: ['testingvishal@yopmail.com']
  //         },
  //         messageId: '<46ba229f-a7ac-fc10-d1e1-4dc99032ec93@gmail.com>'
  //       }
  //     }
  //     else {
  //       console.log("under true  otpfunctions")
  //       info = await transporter.sendMail(mailOptions);
  //     }





  //     console.log(`Email sent: ${info.response}`);
  //     return info;
  //   } catch (error) {
  //     console.error('Error sending email:', error);
  //     throw error; // Rethrow the error to be handled by the caller
  //   }
  // }


}
