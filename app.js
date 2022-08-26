const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const app = express()
const mailer = require('nodemailer')
const axios = require('axios')
const PORT = process.env.PORT || 4000
require('dotenv').config()
  
const corsOpts = {
    origin: [process.env.STAGING_URL],
    optionsSuccessStatus: 200 
  }

app.use(cors(corsOpts))

let urlencodedParser = bodyParser.urlencoded({ extended: true })
app.use(urlencodedParser);
app.use(bodyParser.json())

app.get('/', (req, res)=> {
    res.send('<h1>Portfolio Website Express Server</h1>');
});

app.post('/send', urlencodedParser, (req, res)=>{
    axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET_KEY}&response=${req.body.captcha}`)
    .then((response)=>{
        if(response.data.success == true){
            if((/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(req.body.email)){
                const output = `
                    <h2>Connect Request!</h2>
                    <hr>
                    <h3>Contact Details:</h3>
                    <ul>
                        <li>Name: ${req.body.name}</li>
                        <li>Email: ${req.body.email}</li>
                    </ul>
                    <h4>Message</h4>
                    <p>${req.body.message}</p>
                    <hr>
                `
        
                let transporter = mailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: process.env.EMAIL_HOST_PORT,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USERNAME,
                        pass: process.env.EMAIL_PASSWORD
                    }
                })
        
                let options = {
                    from: process.env.EMAIL_USERNAME,
                    to: process.env.TO_EMAIL_USERNAME,
                    subject: req.body.subject,
                    text: `Hi Piotr, you recieved a connect request from ${req.body.name}, 
                    ${req.body.email} - Message: 
                    ${req.body.message}`,
                    html: output,
                }
        
                transporter.sendMail(options, (error, info) => {
                    if(error){
                        res.send(error)
                        return console.log(error)
                    }else{
                        console.log('Message sent: %s', info)
                        let confirmMsg = `
                            <h2>Successful Delivery!</h2>
                            <hr>
                            <h3>Details:</h3>
                            <ul>
                                <li>Name: ${req.body.name}</li>
                                <li>Email: ${req.body.email}</li>
                            </ul>
                            <h4>Message</h4>
                            <p>${req.body.message}</p>
                            <br>
                            <br>
                            <p>Your message has been successfully delivered, I will be in touch with you shortly.</p>
                            <p>Piotr Wysocki</p>
                            <hr>
                            <small>This is an automatically generated message, please do not reply to this email.</small>
                        `
        
                        let confirmOpts = {
                            from: process.env.EMAIL_USERNAME,
                            to: req.body.email,
                            subject: `PW - Delivery Status`,
                            text: `Hi ${req.body.name}, your message to Piotr Wysocki has
                            been successfully delivered.`,
                            html: confirmMsg,
                        }
        
                        transporter.sendMail(confirmOpts, (error, info) => {
                            if(error){
                                res.send(error)
                                return console.log(error)
                            }else{
                                console.log('Confirmation message sent: %s', info.accepted)
                                return res.json({"Success": true, "msg":"Successfully delivered"});
                            }
                        })
                    }
                })
            }else{
                return res.json({"Success": false, "msg":"Email not formatted properly"});
            }
        }else{
            return res.json({"Success": false, "msg":"Captcha verification failed"});
        }
    }).catch((error)=>{
        return res.json(error)
    })
})

app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`);
})

