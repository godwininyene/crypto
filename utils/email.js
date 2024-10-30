const nodemailer = require('nodemailer');
const pug = require('pug')

module.exports = class Email {
    constructor(user, type,  url, amount, plan){
        this.email = user.email;
        this.firstName = user.name.split(" ")[0];
        this.type = type;
        this.url = url;
        this.amount = amount;
        this.plan = plan;
        this.from = `Trust Platform Finance <${process.env.EMAIL_FROM}>`;
    }

    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            // Using Gmail service
            return nodemailer.createTransport({
                // host:process.env.EMAIL_HOST,
                // port:process.env.EMAIL_PORT,
                service:"Gmail",
                auth:{
                    user:process.env.EMAIL_USERNAME,
                    pass:process.env.EMAIL_PASSWORD
                }
            })
        }

        return nodemailer.createTransport({
            host:process.env.EMAIL_HOST,
            port:process.env.EMAIL_PORT,
            auth:{
                user:process.env.EMAIL_USERNAME,
                pass:process.env.EMAIL_PASSWORD
            }
        })
    }

    async send(template, subject){
        // 1) Render the HTML base on the pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`,{
            firstName:this.firstName,
            url:this.url,
            type:this.type,
            amount:this.amount,
            plan:this.plan,
            subject
        })
        //2) Define email options
        const mailOptions = {
            from:this.from,
            to:this.email,
            subject,
            html
        }
        // 3) Create a transport and send email
       await this.newTransport().sendMail(mailOptions)
    }

    async sendOnBoard(){
        await this.send("welcome", "Account Approval Status")
    }
    async sendTransaction(){
        await this.send("transaction", "Transaction Notice")
    }

    async sendInvestment(){
        await this.send("investment", "Investment Notice")
    }
}

