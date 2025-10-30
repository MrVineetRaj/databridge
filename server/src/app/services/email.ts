import nodemailer from "nodemailer";
import Mailgen, { Table } from "mailgen";
import { envConf } from "../lib/envConf";

class EmailService {
  private transporter: nodemailer.Transporter;
  private mailGenerator: Mailgen;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: envConf.MAIL_TRAP_HOST,
      port: parseInt(envConf.MAIL_TRAP_PORT, 10),
      auth: {
        user: envConf.MAIL_TRAP_USERNAME,
        pass: envConf.MAIL_TRAP_PASSWORD,
      },
    });

    this.mailGenerator = new Mailgen({
      theme: "cerberus",
      product: {
        name: "DataBridge",
        link: envConf.FRONTEND_URL,
      },
    });
  }

  generateWelcomeMailBody({ username }: { username: string }) {
    const email = {
      body: {
        greeting: "Dear",
        signature: "Best regards,",
        name: username,
        intro: [
          "Welcome to DataBridge! We're excited to have you on board.",
          "DataBridge is your go-to platform for Database instance just with just single click get your connection string.",
          "Get started by exploring our features and creating your first project.",
        ],
        action: [
          {
            instructions: "To get started, please visit your dashboard:",
            button: {
              color: "#22BC66", // Optional action button color
              text: "Go to Dashboard",
              link: envConf.FRONTEND_URL,
            },
          },
        ],
        outro: [
          "This mail is system generated.",
          "please do not reply to this mail.",
        ],
      },
    };

    return email;
  }

  generateDatabasePauseNotification({
    username,
    projectTitle,
    inactiveDatabases,
    projectId,
  }: {
    username: string;
    projectTitle: string;
    projectId: string;
    inactiveDatabases: string[];
  }) {
    const email = {
      body: {
        greeting: "Dear",
        signature: "Best regards,",
        name: username,
        intro: [
          `Hey it's about getting your attention toward your project ${projectTitle} as it looks like your databases ${inactiveDatabases.join(
            ", "
          )} weren't receiving any read or write traffic so we paused those databases.`,
          "You can enable it from project dashboard",
        ],
        action: [
          {
            instructions: "To get started, please visit your dashboard:",
            button: {
              color: "#22BC66", // Optional action button color
              text: "Enable Database Connections",
              link: `${envConf.FRONTEND_URL}/console/${projectId}`,
            },
          },
        ],
        outro: [
          "This mail is system generated.",
          "please do not reply to this mail.",
        ],
      },
    };

    return email;
  }
  generateDatabaseDeletedNotification({
    username,
    projectTitle,
    inactiveDatabases,
    projectId,
  }: {
    username: string;
    projectTitle: string;
    projectId: string;
    inactiveDatabases: string[];
  }) {
    const email = {
      body: {
        greeting: "Dear",
        signature: "Best regards,",
        name: username,
        intro: [
          `Hey it's about getting your attention toward your project ${projectTitle} as we notified you about your idle databases ${inactiveDatabases.join(
            ", "
          )} , But it looks like you never took any required action in the grace period so we deleted this/these databases`,
          "You can still access backup of your databases though till next 7 days",
        ],
        outro: [
          "This mail is system generated.",
          "please do not reply to this mail.",
        ],
      },
    };

    return email;
  }
  public async sendWelcomeEmail({
    to,
    username,
  }: {
    to: string;
    username: string;
  }) {
    const mailOptions = {
      from: '"DataBridge" <databridge@unknownbug.tech>',
      to,
      subject: "Welcome to DataBridge - Your Easy to use database provider",
      html: this.mailGenerator.generate(
        this.generateWelcomeMailBody({ username })
      ),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      // console.log("Email sent: %s", info.messageId);
      return { message: "Email sent successfully", success: true };
    } catch (error) {
      console.error("Error sending email:", error);
      return { message: "Error sending email", success: false };
    }
  }

  public async sendPausedWarningMail({
    to,
    username,
    projectTitle,
    inactiveDatabases,
    projectId,
  }: {
    to: string;
    username: string;
    projectTitle: string;
    inactiveDatabases: string[];
    projectId: string;
  }) {
    const mailOptions = {
      from: '"DataBridge" <databridge@unknownbug.tech>',
      to,
      subject: "Attention - Database connections paused",
      html: this.mailGenerator.generate(
        this.generateDatabasePauseNotification({
          username,
          projectTitle,
          inactiveDatabases,
          projectId,
        })
      ),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      // console.log("Email sent: %s", info.messageId);
      return { message: "Email sent successfully", success: true };
    } catch (error) {
      console.error("Error sending email:", error);
      return { message: "Error sending email", success: false };
    }
  }
  public async sendDatabasesDeletedWarningMail({
    to,
    username,
    projectTitle,
    inactiveDatabases,
    projectId,
  }: {
    to: string;
    username: string;
    projectTitle: string;
    inactiveDatabases: string[];
    projectId: string;
  }) {
    const mailOptions = {
      from: '"DataBridge" <databridge@unknownbug.tech>',
      to,
      subject: "Attention - Database connections deleted",
      html: this.mailGenerator.generate(
        this.generateDatabaseDeletedNotification({
          username,
          projectTitle,
          inactiveDatabases,
          projectId,
        })
      ),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      // console.log("Email sent: %s", info.messageId);
      return { message: "Email sent successfully", success: true };
    } catch (error) {
      console.error("Error sending email:", error);
      return { message: "Error sending email", success: false };
    }
  }
}

export const emailServices = new EmailService();
