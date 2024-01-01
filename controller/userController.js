const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const verifyOtp = require('../models/otpVerification');
const e = require('express');



// load home page
module.exports.loadHome = (req, res) => {
    try {
        res.render('home');
    } catch (error) {
        console.log(error)
    }
}


// ================================== User login ===============================================\\

// load login page
module.exports.loadLogin = (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error)
    }
}

module.exports.userLogin = async (req, res) => {
    try {
        console.log(req.body.email)
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            if (user.verified) {

                if (user.isBlocked) {
                    console.log('User is blocked');
                } else {
                    const enteredPass = req.body.password;
                    const databasePass = user.password;
                    const pass = await bcrypt.compare(enteredPass, databasePass);
                    console.log(pass);
                    if (pass) {
                        req.session.user = {
                            _id: user._id,
                            name: user.name,
                            email: user.email
                        }
                        res.redirect('/');
                    } else {
                        console.log('enter correct password');
                    }
                }

            } else {
                console.log('user not verified');
            }
        } else {
            console.log('user not found');
        }
    } catch (error) {
        console.log(error);
    }
}








// ======================================Ueser sign UP and otp verification ==============================================  \\

// load sign up page
module.exports.loadRegister = (req, res) => {
    try {
        res.render('register');
    } catch (error) {
        console.log(error)
    }
}





// register user
module.exports.insertUser = async (req, res) => {
    try {
        const uname = await User.findOne({ name: req.body.uname });
        const email = await User.findOne({ email: req.body.email });

        if (uname) {
            console.log("user alredy exists");
        } else if (email) {
            console.log("email already exists");
        } else {
            const passHash = await bcrypt.hash(req.body.password, 10);

            const user = new User({
                name: req.body.uname,
                email: req.body.email,
                mobile: req.body.phone,
                password: passHash,
                isAdmin: false,
                isBlocked: false,
                verified: false,
            })

            const save = await user.save();
            // console.log(user.email);
            if (save) {
                sentOtp(user.email);
                res.redirect(`/otp?email=${user.email}`);
            } else {
                console.log('not saved....');
            }
        }

    } catch (error) {
        console.log(error)
    }
}


// sent otp and load otp page

const sentOtp = async (email) => {
    try {

        const transport = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: 'najinn675@gmail.com',
                pass: 'dnkc erej pptj fnif'
            }

        })

        const createdOTP = `${Math.floor(1000 + Math.random() * 9000)}`


        const mailOption = {
            from: 'najinn675@gmail.com',
            to: email,
            subject: 'OTP Verification',
            html: `Your otp is${createdOTP}`
        }

        await transport.sendMail(mailOption);
        const hashOTP = await bcrypt.hash(createdOTP, 10);

        const otp = new verifyOtp({
            Email: email,
            otp: hashOTP
        })

        await otp.save();
        // const isSave = await otp.save();

        // if(isSave) {

        // }


    } catch (error) {
        console.log(error);
    }
}


// load otp page
module.exports.loadotp = async (req, res) => {
    try {
        if (req.query.is) {
            sentOtp(req.query.email);
        }
        console.log(req.query.email);
        const email = req.query.email || '******gmail.com';
        // console.log("re", email)
        const user = await User.findOne({ email: email })
        res.render('otp', { email: email, user: user });

    } catch (error) {
        console.log(error);
    }
}

// load login with otp page

module.exports.OTPlogin = (req, res) => {
    try {
        res.render('otpLogin')
    } catch (error) {
        console.log(error)
    }
}

// verify otp 

module.exports.verifyOTP = async (req, res) => {
    try {

        const email = req.query.email;
        console.log('otp verify email', email);


        const otp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;

        const verify = await verifyOtp.findOne({ Email: email });


        if (verify) {
            const { otp: hashed } = verify;
            const compare = await bcrypt.compare(otp, hashed);
            console.log(compare);
            if (compare) {
                const user = await User.findOne({ email: email });
                if (user) {
                    await User.findByIdAndUpdate({ _id: user._id }, { $set: { verified: true } });
                    req.session.user = {
                        _id: user._id,
                        email: user.email,
                        name: user.name
                    }
                    await verifyOtp.deleteOne({ email: email })
                    res.redirect('/');
                } else {
                    console.log('user not found');
                }
            } else {
                console.log('OTP is incorrect')
            }
        } else {
            console.log('otp expired')
        }


    } catch (error) {
        console.log(error);
    }
}



// Login with otp
module.exports.otpLogin = async (req, res) => {
    try {
        const email = req.query.email;
        console.log(email)

        const otp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;
        const find = await verifyOtp.findOne({ Email: email });

        if (find) {

            const compare = await bcrypt.compare(otp, find.otp);
            const user = await User.findOne({ email: email });
            if (compare) {
                req.session.user = {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                }
                res.redirect('/');

            } else {

            }

        } else {
            console.log('otp expired')
        }
    } catch (error) {
        console.log(error);
    }
}
// ============================================ User sign up ends =============================================\\


// user logout

module.exports.userLogout = (req, res) => {
    try {
        req.session.user = null;
        res.redirect('/');
    } catch (error) {
        console.log(error)
    }
}


module.exports.resend = async (req, res) => {
    try {
        const email = req.query.email;
        console.log(email);
        if(email) {
            const otp = await verifyOtp.deleteMany({Email: email});
            sentOtp(email);
        } else {
            console.log('Email doest receiced');
        }
          
    } catch (error) {
        console.log(error)
    }
}