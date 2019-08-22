const sgMail = require("@sendgrid/mail");
const sendgridApiKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sendgridApiKey);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "vladislav.tomashov@gmail.com",
    subject: "Thanks for joining in",
    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    //   html: "<strong>and easy to do anywhere, even with Node.js</strong>"
  });
};

module.exports = {
  sendWelcomeEmail
};
