    var express = require('express');
    var goziextech = express ();
    var port = process.env.PORT || 3000;
    var bodyParser = require('body-parser');
    //var mongo = require('mongodb');
    var mongoose = require ('mongoose');
    var path = require('path');
    var cookieParser = require('cookie-parser');
    var exphbs = require('express-handlebars');
    var expressValidator = require('express-Validator');
    var flash = require('connect-flash');
    var session = require('express-session');
    var passport = require('passport');
    var LocalStrategy = require('passport-local').Strategy;
    var nodemailer = require('nodemailer');
    var helmet = require('helmet');
    var nocache = require('nocache');
    //var expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    //View Engine
    /*goziextech.set('views',path.join (__dirname, 'views'));
    goziextech.engine('handlebars', exphbs({defaultLayout:'layout'}));
    goziextech.set('view engine', 'handlebars');*/

  //Req.header is different from Res.header
    goziextech.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      //res.header("X-Frame-Options", "DENY");    
      next();
    });

    //Securities
    goziextech.use(helmet());
    goziextech.disable('x-powered-by');
    //goziextech.use(nocache())

    //BodyParser Middleware
    goziextech.use(bodyParser.json());
    goziextech.use(bodyParser.urlencoded({extended: true}));
    goziextech.use(cookieParser());

    //Express Session
    goziextech.use (session({
        secret: 'secret',
        saveUninitialized: true,
        resave:true

    }));
    
    /*   
    goziextech.use(session({
      name: 'session',
      keys: ['key1', 'key2'],
      cookie: {
        secure: true,
        httpOnly: true,
        domain: 'example.com',
        path: 'foo/bar',
        expires: expiryDate
      }
    }))*/ 

    //Passport init
    goziextech.use(passport.initialize());
    goziextech.use(passport.session());


    //Express Validator
    goziextech.use(expressValidator({
    errorFormarter: function (param, msg, value){
     var namespace = param.split('.')
     ,root = namespace.shift()
     ,formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return{
            param:formParam,
            msg: msg,
            value: value
        };  

            }    
    }));

    // Connect Flash
    goziextech.use(flash());

    // Global Vars
    goziextech.use(function(req, res, next){
    res.locals.success_msg = req.flash ('success_msg');
    res.locals.error_msg = req.flash ('error_msg');
    res.locals.error = req.flash ('error');  
    next();    
    });


    //goziextech.use(express.static(path.join(__dirname +'studentdashboard')));
    //goziextech.use(express.static(__dirname +'/studyinbudapest'));
    goziextech.use(express.static(__dirname +'/universityapp'));
    //goziextech.use(express.static(__dirname +'/plugins'));


    Students = require('./models/studentsmodel.js'); //connect students collection
    Universities = require('./models/universitymodel.js');//connect universities collection
    //Connect to Mongoose
    //mongoose.connect('mongodb://localhost/students');
    //var db = mongoose.connection;


    // Connect to Mongo DB
    var promise = mongoose.connect('mongodb://localhost:/Studyinbudapestusers', {
    useMongoClient: true,
      /* other options */
    });
    promise.then(function(db) {

    db.model('Students');  //Student model  
    db.model('Universities'); // Universities Model
      /* Use `db`, for instance `db.model()`*/
    });

    //Passport
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });
    
    //Serialize Passport
    passport.deserializeUser(function(id, done) {
      Universities.getUniversitiesById(id, function(err, user) {
        done(err, user);
      });
    });

    //Passport Strategy
    passport.use(new LocalStrategy(
      function(username,password, done) {
       Universities.getUniversityByUsername(username,password, function(err, user) {
          if (err) throw err;
          if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
          }   
          return done(null,user);
       
           /* if (!user.validPassword(password)) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          Students.comparePassword(password, Students.password, function(err,isMatch))
           if (err) throw err;
          if (isMatch) {
           return done(null,user);
          } else {
              return done(null, false, { message: 'Incorrect password.' }
          }

           return done(null, user);*/   
        });
      }));


      // Reusable Nodemailer Transporter
        let transporter = nodemailer.createTransport({
            host: 'mail.studyinbudapest.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: 'admissions@studyinbudapest.com', // user
                pass: '@dmissions1988' // password
            },
            tls: {
            rejectUnauthorized: false
        }

        }); 

    //Login and Authenticate University
    goziextech.post('/', 
      passport.authenticate('local',{ failureRedirect: '#/login/error',failureFlash:true }),
      //Username and Password comes from req               
      function (req, res, next) { 
        //If successfull
        res.redirect('#/university/account/' + req.user.id);
        //res.json(user);
      });

    function ensureAuthenticated(req, res, next) {
     if (req.isAuthenticated()){
         //req.user.isAuthenticated();
        return next(); 
     }  else { 
       /* res.json({
         status: "You are unathourized";   
        });*/
        res.redirect('/');
     }  

    }

  function ensureAuthorized(req, res, next) {   
    var authorizedDomain = req.body.authdomain;
    var goziextechCustomKey = "/validated@GoziexTech1234";
    var validAuthorizedDomain = authorizedDomain + goziextechCustomKey ;  
     if (validAuthorizedDomain == "http://app.studyinbudapest.com/validated@GoziexTech1234"){
        return next(); 
     }  else {
         res.json({
         status: "You are unathourized by Goziex Tech"   
        });
     }  

    }


    //Logout Universities
    goziextech.get('/logout', function (req, res, next) { 
        req.logout();
        res.redirect('/');
        //res.json(user);
      });/**/


    //API Home
    goziextech.get('/',function(req, res, next){
    res.send('You are not authorized to view this page'); 
    });

  //Custom Security
    goziextech.get('/testauthorization', ensureAuthorized, function(req, res, next){
    res.send('You are viewing an authorized request');
    });


   /* //Debug
    goziextech.get('/test', ensureAuthenticated, function(req, res, next){
    res.send('Please use /api/students for students goziextechlicants');    
    });*/

    goziextech.get('/authentication', ensureAuthenticated, function(req, res, next){ 
    /*if (err){
        res.send('Database or passport error please check');
        return console.log(err)
        } */      
    res.send(req.user);
    });

    //Create API 
    //Get for Student Applicants
    //ensureAuthenticated,

    goziextech.get('/students', function(req, res, next){

     //res.send('Welcome to Students API area');
     //Students declared in line 80    
       Students.getStudents (function(err, students){
       if (err){ throw err;
                res.send('Database error please check'); 
        }   
         res.json(students);
        });    

    });

    //Post student details
    //ensureAuthenticated,
    goziextech.post('/students', function(req, res, next){
    var student = req.body;   
    //res.send('Welcome to Students API area');  

        Students.addStudent (student, function(err, student){
        if (err){ return console.log(err);
        }  
          // res.send('Student Added');    
           res.json(student); //This is to sendback the recently added student as payload can be scrapped
        });    

    });

    //Delete student details
    goziextech.delete('/students/:_id', ensureAuthenticated,function(req, res, next){    
    var id = req.params._id;      
    //res.send('Welcome to Students API area');  

        Students.deleteStudent (id, function(err, student){
        if (err){ throw err;
        }   
           res.json(student);
        });    

    });


    //Get Student by ID
    goziextech.get('/students/:_id', ensureAuthenticated, function(req, res, next){

         //res.send('Welcome to Students API area');  
        //Declared in line 80
        Students.getStudentsById (req.params._id,function(err, student){
        if (err){ throw err;
        }   
           res.json(student);
        //res.render('studentdashboard/index.html')    
        });    

    });


    //Get Universities
    goziextech.get('/universities', ensureAuthenticated, function(req, res, next){

     //res.send('Welcome to Universities API Endpoint');  
       Universities.getUniversities (function(err, universities){
       if (err){ throw err;
                res.send('Database error please check'); 
        }   
         res.json(universities);//Send from collection name in mongoDB//Trial
        });    

    });


     //Add Authorization Key
    //getUniversityByEmail and Check for Existing User
    goziextech.post('/u/c',function(req, res, next){
    var username = req.body.username;
    var email = req.body.email;    
        Universities.getUniversityByEmail (email, function(err, university){ //callback
        if (err){ throw err;
        } // Replace with if(university) // then res.json userfound
        if (!university) {
            res.json({
            status:"usernotfound"
            });  
        } else {  
            res.json(university)
        }  


        });    
    });

   //getStudentByEmail and Check for Existing User
    goziextech.post('/s/c',function(req, res, next){
    var email = req.body.email;    
        Students.getStudentsByEmail (email, function(err, student){ 
        if (err){ return console.log (err);
        } 
        if (!student) {
            res.json({
            status:"usernotfound"
            });  
        } else {  
            res.json(student)
        }  


        });    

    });

  //CheckStatusByEmail
    goziextech.post('/c/s',function(req, res, next){
        var email = req.body.email;    
        Students.CheckStatusByEmail (email, function(err, student){ 
        if (err){ return console.log (err);
        } 
        if (!student) {
            res.json({
            status:"usernotfound"
            });  
        } else {  
            res.json(student)
        }  
        });    
      });


     //Add Authorization Key
    //Create University
    goziextech.post('/universities',function(req, res, next){
    var university = req.body; 
        
    Universities.addUniversity (university, function(err, createduniversity){
        
        if (err){   
            return res.json({
            status:"Goziex Tech Info: Internal goziextech error or incorrect validation"    
            });
            console.log(err);
                   
        }      
         res.json(createduniversity); 
/*
        if (createduniversity) {   
         res.json(createduniversity);    
         // Set 30 Days trial period    
         setTimeout(function(){
         //When Json is sent res ends
         Universities.deactivateTrial (createduniversity, function(err, deactivateduniversity){
          if (err){ throw err;
         }     
           //res.json(deactivateduniversity); //Send back trial deactivation 
           console.log(deactivateduniversity) 
         })

         }, 600000);    


        } // end else 
*/

        });    

    });

     
    //Edit University Profile
    goziextech.put('/edit/universities/:_id', ensureAuthenticated,function(req, res, next){
    var id = req.params._id;
    var universitydetails = req.body; //pass every data from body 
    var universityfirstname = universitydetails.first_name;
    var universitylastname =  universitydetails.last_name;  
    var universityemail = universitydetails.email;
    var applicationportal = universitydetails.application_portal;    
    var password = universitydetails.password;
    var phonenumber = universitydetails.phone;    
        
        //First name
        if (universityfirstname){
        //Update First Name    
          Universities.EditUniversityFirstName (id, universityfirstname, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        } 
        
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>FIRST NAME</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        }); 

              
           res.json(university);
        });
            
        }
        
        //IF Last Name
         if (universitylastname){
        //Update Last Name    
          Universities.EditUniversityLastName (id, universitylastname, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        } 
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>LAST NAME</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });       
           res.json(university);
        });
            
        }
         
        //IF Email    
        if (universityemail){
        //Update Email
        Universities.EditUniversityEmail (id, universityemail, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        } 
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>EMAIL</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
       
        
         //Application Portal
        if (applicationportal){
        //Update Application Portal    
          Universities.EditUniversityApplicationPortal (id, applicationportal, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        } 
        
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>APPLICATION PORTAL</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        }); 

              
           res.json(university);
        });
            
        }
        
        //IF Password
        if (password){
        //Update Password
        Universities.EditUniversityPassword  (id, password, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        } 
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>PASSWORD</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //IF Phone Number
        if (phonenumber){
        //Update Phone Number
        Universities.EditUniversityPhone  (id, phonenumber, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        } 
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>PHONE NUMBER</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
      

    });

    goziextech.put('/edit/universities/2/:_id', ensureAuthenticated, function(req, res, next){
     
    var id = req.params._id;
    var universitydetails = req.body; //pass every data from body 
    var universityfirstname = universitydetails.first_name;
    var universitylastname =  universitydetails.last_name;  
    var universityemail = universitydetails.email;
    var password = universitydetails.password;
    var phonenumber = universitydetails.phone;
    var applicationportal = universitydetails.application_portal;    
        
        //1. If Email and Phone
        if ((universityemail) && (phonenumber)){
        //Update Email and Phone
        Universities.EditUniversityEmailPhone (id, universityemail, phonenumber, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        } 
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>EMAIL AND PHONE NUMBER</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });
            
        }
        
        //2. Email and  Password
        if (universityemail && password){
        //Update Email Password
        Universities.EditUniversityEmailPassword  (id, password,universityemail, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>EMAIL AND PASSWORD</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //3. Email and First name
        if (universityemail && universityfirstname){
        //Update Email First name
        Universities.EditUniversityFirstNameEmail  (id, universityfirstname,universityemail, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>EMAIL AND FIRST NAME</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //4.Password  and Phone
        if (password && phonenumber){
        //Update Password Phone
        Universities.EditUniversityPasswordPhone  (id, password, phonenumber, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        } 
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>PASSWORD AND PHONE</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //5. First Name and Password
        if (universityfirstname && password){
        //Update First Name Password
        Universities.EditUniversityFullnamePassword  (id, universityfirstname, password, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        } 
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>FIRST NAME AND PASSWORD</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //6. First Name and Phone Number
         if (universityfirstname && phonenumber){
        //Update First Name Phone Number
        Universities.EditUniversityPhoneFullname  (id, universityfirstname, phonenumber, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>FIRST NAME AND PHONE NUMBER</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        
        //7. Last Name and First Name
        if (universityfirstname && universitylastname){
        //Update Last Name Full Name
        Universities.EditUniversityLastNameFullName  (id, universityfirstname,  universitylastname, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>LAST NAME AND FIRST NAME</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //8. Last Name and Password
        if (universitylastname && password){
        //Update Last Name Password
        Universities.EditUniversityLastNamePassword  (id, universitylastname, password, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>LAST NAME AND PASSWORD</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //9. Last Name and Email
        if (universitylastname && universityemail){
        //Update Last Name Email
        Universities.EditUniversityLastNameEmail  (id, universitylastname, universityemail, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>LAST NAME AND EMAIL</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //10. Last Name and Phone Number
        if (universitylastname && phonenumber){
        //Update Last Name Phone Number
        Universities.EditUniversityLastNamePhoneNumber  (id, universitylastname, phonenumber, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>LAST NAME AND PHONE NUMBER</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
      
         //11. University FirstName and Application Portal 
        if (universityfirstname && applicationportal){
        //Update University FirstName and Application Portal 
        Universities.EditFirstNameApplicationPortal  (id, universityfirstname, applicationportal, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>FIRST NAME AND APPLICATION PORTAL</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //12. University Last Name and Application Portal 
        if (universitylastname && applicationportal){
        //Update University FirstName and Application Portal 
        Universities.EditLastNameApplicationPortal  (id, universitylastname, applicationportal, {}, function(err, university){
        //console.log(university);    
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>LAST NAME AND APPLICATION PORTAL</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //13. University Email Application Portal  
        if (universityemail && applicationportal){
        //University Email Application Portal  
        Universities.EditEmailApplicationPortal  (id, universityemail, applicationportal, {}, function(err, university){   
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>EMAIL AND APPLICATION PORTAL</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //14. University Password Application Portal  
        if (password && applicationportal){
        // Update University Password Application Portal 
        Universities.EditPasswordApplicationPortal  (id, password, applicationportal, {}, function(err, university){   
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>PASSWORD AND APPLICATION PORTAL</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        //13. University Phone Application Portal  
        if (phonenumber && applicationportal){
        //University Email Application Portal  
        Universities.EditPhoneApplicationPortal(id, phonenumber, applicationportal, {}, function(err, university){   
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>PHONE AND APPLICATION PORTAL</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });     
           res.json(university);
        });  
        }
        
        
    });

    goziextech.put('/universities/edit/all/:_id', ensureAuthenticated, function(req, res, next){
    var id = req.params._id;    
    var universitydetails = req.body;
    var universityfirstname = universitydetails.first_name;
    var universitylastname =  universitydetails.last_name;  
    var universityemail = universitydetails.email;
    var password = universitydetails.password;
    var phonenumber = universitydetails.phone;
    var applicationportal = universitydetails.application_portal;
        
        
         //11. First Name, Last Name,Email and Password
        if ((universityfirstname) && (universitylastname) && (universityemail) && (password) && (!phonenumber) && (!applicationportal)){
        //Update Last Name Phone Number
        Universities.EditFirstNameLastNameEmailPassword (id,universityfirstname, universitylastname, universityemail, password, {}, function(err, university){   
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>account information</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });  //End Transporter   
            
        });  
        }     
        
        
     //12. First Name, Last Name,Email
        if ((universityfirstname) && (universitylastname) && (universityemail) && (!password) && (!phonenumber) && (!applicationportal)){
        //Update First Name, Last Name,Email
        Universities.EditFirstNameLastNameEmail (id,universityfirstname, universitylastname, universityemail, {}, function(err, university){   
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>account information</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });  //End Transporter   
            
        });  
        }     
        
        //13. First Name, Last Name,Email, Password, Phone Number and Application Portal
        if (universityfirstname && universitylastname && universityemail && password && phonenumber && applicationportal){
        //Update Last Name Phone Number
        Universities.EditAllUniversityDetail (id,universityfirstname, universitylastname, universityemail, password, phonenumber, applicationportal, {}, function(err, university){   
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>account information</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });  //End Transporter   
            
        });  
        }
        
        //13. First Name, Last Name,Email and Application Portal
        if ((universityfirstname) && (universitylastname) && (universityemail) && (!password) && (!phonenumber) && (applicationportal)){
        //Update First Name, Last Name,Email and Application Portal
        Universities.EditFirstNameLastNameEmailApplicationPortal (id,universityfirstname, universitylastname, universityemail, applicationportal, {}, function(err, university){   
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b>First Name, Last Name,Email and Application Portal</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });  //End Transporter   
            
        });  
        }    
        
        //13. Last Name,Email and Application Portal
        if ((!universityfirstname) && (universitylastname) && (universityemail) && (!password) && (!phonenumber) && (applicationportal)){
        //Update Last Name,Email and Application Portal
        Universities.EditLastNameEmailApplicationPortal (id, universitylastname, universityemail, applicationportal, {}, function(err, university){   
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b> Last Name,Email and Application Portal</b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });  //End Transporter   
            
        });  
        } 
        
        //14. Application Portal, Password and Phone
        if ((!universityfirstname) && (!universitylastname) && (!universityemail) && (password) && (phonenumber) && (applicationportal)){
        //Update Application Portal, Password and Phone
        Universities.EditApplicationPortalPasswordPhone (id, applicationportal, password, phonenumber, {}, function(err, university){   
        if (err){ return console.log(err);
        }
        let securityMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: university.email, // reciever
            subject: 'Account Security: Your account information has been changed!' ,
            text: 'Account Security: Your account information has been changed!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ university.first_name +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-badge-study-in-budapest-mobile-app.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;"></p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just changed your <b> Application Portal, Password and Phone </b>, if you did not initiate this request or change please  do not ignore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         } 
        
        transporter.sendMail(securityMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(securityMail);
        });  //End Transporter   
            
        });  
        }    
        
    });

       //A dump , deletable 
       /*if ((!universityfirstname) && (!universityemail) && (!password) && (!phonenumber)){
            res.send('No data entered by user', 400);  
        }*/


    /*//Test Status Codes 
    goziextech.get('/statuscodes', function(req, res, next){
     res.send (400);    
    });*/


    //Deactivate Trial
    goziextech.post('/deactivatetrial', ensureAuthenticated,function(req, res, next){
        var id = req.body.id;
         Universities.deactivateTrialPeriod (id, function(err, deactivateduniversity){
          if (err){ throw err;
         } 
        if (deactivateduniversity){
        res.json(deactivateduniversity)    
        }     
          });

        });

    //Deactivate Subscription
    goziextech.post('/deactivatesubscription', ensureAuthenticated,function(req, res, next){
        var id = req.body.id;
         Universities.resetSubscription (id, function(err, deactivateduniversity){
          if (err){ return console.log (err);
         } 
        if (deactivateduniversity){
        res.json(deactivateduniversity)    
        } else {
          res.sendStatus(401); //Not found 
        }    
          });

        });

     //Add Authorization Key
    //Email Activation
    goziextech.post('/activate/:email', function(req, res, next){
    var email = req.params.email; 

        Universities.activateUniversity (email, function(err, university){
        if (err){ throw err;
        }  
          if (!university) {
            res.json({
            status:"usernotfound"
            });  
        } else if (university) {  

        Universities.activateAccount( university, function(err,university){
         res.json(university)     
        });

        } // end else 
        });    

    });


     
    //P Reset
    goziextech.post('/reset',function(req, res, next){
    var email = req.body.useremail; 

        Universities.activateUniversity (email, function(err, university){
        if (err){ throw err;
        }  
          if (!university) {
            res.json({
            status:"usernotfound"
            });  
        } else if (university) {  

        //Universities.resetUniversityp( university, function(err,university){
         res.json(university)
         var password = university.password;
         var email = university.email;
         var firstname = university.first_name.toUpperCase();

         let resetMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com',
            to: email, // list of receivers
            subject: firstname +' here is your password reset instructions' , // Subject line // or a university sent you a message
            text: 'Password Reset Instructions', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="border-bottom:1px solid #f6f6f6;"><h1 style="font-size:14px; font-family:arial; margin:0px; font-weight:bold;">'+ firstname +',</h1><center><img src="http://www.studyinbudapest.com/images/emailassets/security-icon-300x300-blue-study-in-budapest.png" style="display:block; width:10%"></center><p style="margin-top:0px; color:#bbbbbb;">Here are your password reset instructions.</p></td></tr><tr><td style="padding:10px 0 30px 0;"><p>Someone has just requested to change the password to your account, if you did not initiate this request or change please igonore this email and kindly <a href="http://help.studyinbudapest.com"> contact support</a></p><center><b>PASSWORD:'+ password +'</b></center><b>- Thanks Studyinbudapest</b></td></tr><tr><td  style="border-top:1px solid #f6f6f6; padding-top:20px; color:#777">If you continue to have problems, please feel free to contact us at support@studyinbudapest.com</td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited<br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>' 

         }
       // });

        transporter.sendMail(resetMail, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(resetMail);
        }); 



        } // end else 
        });    

    });


    //Delete university details
    goziextech.delete('/universities/:_id', ensureAuthenticated, function(req, res, next){    
       var id = req.params._id;    
    //res.send('Welcome to Students API area');
        Universities.deleteUniversity (id, function(err, university){
        if (err){ throw err;
        } 
        res.json(university);    
        });    

    });


    //Get University by ID
    goziextech.get('/universities/:_id', ensureAuthenticated,function(req, res, next){
        Universities.getUniversitiesById (req.params._id,function(err, university){
        if (err){ throw err;
        }   
           res.json(university);
        //res.render('studentdashboard/index.html')    
        });    

    });

    //Get Recruited Student by ID
    goziextech.get('/recruited/universities/:_id', ensureAuthenticated, function(req, res, next){
        Universities.getRecruitedStudentById (req.params._id,function(err, university){
        if (err){ throw err;
        }   
           res.json(university);
        //res.render('studentdashboard/index.html')    
        });    

    });


    //Update university student details
    goziextech.put('/universities/:_id', ensureAuthenticated, function(req, res, next){
    var id = req.params._id;
    var student = req.body; 
        Universities.UpdateRecruitedStudents (id, student, {}, function(err, student){   
        if (err){ throw err;
        }   
           res.json(student);
        });    
    });


    //Add Processed Student
    goziextech.put('/universities/proccessed/:_id',ensureAuthenticated, function(req, res, next){

    var id = req.params._id;
    var student = req.body; 
        Universities.AddProcessedStudents (id, student, {}, function(err, student){
        console.log(student);    
        if (err){ throw err;
        }   
           res.json(student);
        });    

    });


    //Update university plan
    goziextech.put('/universities/plan/:_id', ensureAuthenticated,function(req, res, next){

    var id = req.params._id;
    var plan = req.body.plan;
    var dateofsubscription = req.body.sub;    
    //console.log(plan)    
       Universities.updateUniversityPlan (id, plan, dateofsubscription, {}, function(err, university){
        //console.log(university);    
       if (err){ return console.log (err);
        }   
          res.json(university);
       });   

    });


    //Update student details
    goziextech.put('/students/:_id', ensureAuthenticated, function(req, res, next){

    var id = req.params._id;    
    var student = req.body;   
    //res.send('Welcome to Students API area');  

        Students.updateStudent (id, student, {}, function(err, student){
        if (err){ throw err;
        }   
           res.json(student);
        });    

    });

    
    //Handle Recruit Messages
    goziextech.post('/recruit', ensureAuthenticated, function(req, res, next){

        //Declare Variables
        var stdntfnmae = req.body.first_name;
        var lastname = req.body.last_name;
        var stdnteml = req.body.email;
        var std = req.body.student_id;
        var universityname = req.body.university.toUpperCase();
        var country = req.body.country;
        var phone = req.body.phone;
        var course = req.body.course;
        var applicationstatus = req.body.application_status;
        var academicqualification = req.body.academic_qualification;
        var language = req.body.language_proficiency;
        var travel = req.body.travel_visa;
        var accountstatus = req.body.accountstatus;
        var onlineportal = req.body.onlineportal;
        var date = req.body.date;
        //var admsnofcr = req.body.admsnofcr; 
        //console.log(accountstatus);
        //console.log(onlineportal);
        
        if (accountstatus == "free"){
            
        let mailOptions = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: ' Congratulations! ' + stdntfnmae + ' you recieved an application offer' , // Subject line // or a university sent you a message
            text: 'Welcome to Studyinbudapest', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8;"><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +'</b><p>Whats going on in ' + country + '? '+ universityname +' will like to offer you an oppurtunity to apply to their university, to accept this application offer visit</p><center><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Apply now </a></center><p>You can read more about this university on your Studyinbudapest mobile app. Study in Budapest makes it easy for you to apply for admission to one university and get recruited by multiple universities, travel, visa, and city guide in one app</p><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration:underline;">Unsubscribe</a> </p></div></div></div></body>'
        };
            
         // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            //console.log('Message sent: %s', info.messageId);
            //console.log(mailOptions);
        });     
    
            
        } else {
            //If not free 
         let mailOptions = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: ' Congratulations! ' + stdntfnmae + ' you recieved an application offer' , // Subject line // or a university sent you a message
            text: 'Welcome to Studyinbudapest', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8;"><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +'</b><p>Whats going on in ' + country + '? '+ universityname +' will like to offer you an oppurtunity to apply to their university, to accept this application offer visit</p><center><a href="'+ onlineportal +'" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> University Website </a></center><p>You can read more about this university on your Studyinbudapest mobile app. Study in Budapest makes it easy for you to apply for admission to one university and get recruited by multiple universities, travel, visa, and city guide in one app</p><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration:underline;">Unsubscribe</a> </p></div></div></div></body>'
        };
            
         // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            //console.log('Message sent: %s', info.messageId);
            //console.log(mailOptions);
        });     
       
            
            
        }
        
        
       
    });

    //Handle Contact Message to Student
    goziextech.post('/message', ensureAuthenticated, function(req, res, next){

        //Declare Variables
        var stdntfnmae = req.body.first_name;
        var stdnteml = req.body.email;
        var uvrstynm = req.body.university;
        var uvstem = req.body.university_email;
        var message = req.body.message;
        var applicationportal = req.body.applicationportal;

        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: uvrstynm + ' sent you a message' , // Subject line // or a university sent you a message
            text: 'Welcome to Studyinbudapest', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8;"><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +'</b><p>'+ message +'</p><center><a href="mailto:'+ uvstem +'" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Reply </a></center><center><a href="'+ applicationportal +'" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #32CD32; border-radius: 60px; text-decoration:none;"> Apply</a></center><p>Study in Budapest makes it easy for you to apply for admission to one university and get recruited by multiple universities, travel, visa, and city guide in one app.</p><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration:underline;">Unsubscribe</a> </p></div></div></div></body>'
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
           if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            //console.log('Message sent: %s', info.messageId);
            //console.log(mailOptions);
        }); 
    });

    
   //Handle Contact Message to Student
    goziextech.post('/applymail', function(req, res, next){

        //Declare Variables
        var stdntfnmae = req.body.first_name;
        var stdntlname = req.body.last_name;
        var stdnteml = req.body.email;
        var uvrstynm = req.body.university;
        var course = req.body.course;
        var baseurl = "http://app.studyinbudapest.com/";
        var applicationportal = "http://www.studyinbudapest.com/search-universities";
        var universityemail= "admissions@studyinbudapest.com";
        var amount = req.body.amount; 
        var date = req.body.date_of_activity;
        
        if (uvrstynm == "Mcdaniels College"){
         var applicationportal = baseurl + "apply-to-mcdaniel.html";                
            
        } else if (uvrstynm == "Budapest Metropolitan University") {
         var applicationportal = baseurl + "apply-to-metropolitan.html";
           
        } else if (uvrstynm == "Eotvos Lorand University") {
         var applicationportal = baseurl + "apply-to-elte.html";
                
        } else if (uvrstynm == "International Business School") {
         var applicationportal = baseurl + "apply-to-ibs.html";
            
            
        } else if (uvrstynm == "Budapest Arts & Design University") {
         var applicationportal = baseurl + "apply-to-mome.html";
            
            
        } else if (uvrstynm == "Semmelweis Medical University") {
         var applicationportal = baseurl + "apply-to-semmelweis.html";
                    
        } else if (uvrstynm == "Budapest University of Science") {
         var applicationportal = baseurl + "apply-to-bme.html";
                        
        } else if (uvrstynm == "Corvinus University") {
         var applicationportal = baseurl + "apply-to-corvinus.html";
           
            
        } else if (uvrstynm == "Budapest Business School") {
         var applicationportal = baseurl + "apply-to-bgf.html";   
            
        } else if (uvrstynm == "Central European University") {
         var applicationportal = baseurl + "apply-to-ceu.html";
         
        } else {
          var applicationportal = applicationportal;    
        } //End url check  
        //Apply mail
        let applyMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: stdntfnmae + ' you started a new application' ,
            text: 'Application Recieved', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8;"><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +'</b><p> Your application to study <b>'+ course +'</b> at <b>'+ uvrstynm +'</b> has been processed by our app, however to complete your application, please make sure that you complete the university registration form as well, if you do not complete the registration form on the university website or portal, your application will not be processed by the university, if you skipped this step or abandoned the university form on their website, you can continue here</p><center><a href="'+ applicationportal +'" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Continue </a></center><p>If you will like to ask a question from the university, you can send a message to '+ universityemail +'</p><center><a href="'+ applicationportal +'" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #32CD32; border-radius: 60px; text-decoration:none;"> Re-Apply</a></center><p>Study in Budapest connects you with universities and makes it easy for you to apply for admission to one university and get recruited by multiple universities, travel, visa, and city guide in one app.</p><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration:underline;">Unsubscribe</a> </p></div></div></div></body>'
        };
        
        
        // setup email data with unicode symbols
        let invoice = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: ' Payment Reciept' , // Subject line // or a university sent you a message
            text: 'Your invoice is enclosed', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="background:#1e88e5; padding:20px; color:#fff; text-align:center;"> Goziex Technologies Limited </td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +' '+ stdntlname +'</b><p style="margin-top:0px;">Invoice</p></td><td align="right" width="100"> '+ date +'</td></tr><tr><td colspan="2" style="padding:20px 0; border-top:1px solid #f6f6f6;"><div><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td style="font-family: "arial"; font-size: 14px; vertical-align: middle; margin: 0; padding: 9px 0;">'+ course +'</td><td style="font-family: "arial"; font-size: 14px; vertical-align: middle; margin: 0; padding: 9px 0;"  align="right">€ '+ amount +'</td></tr><tr class="total"> <td style="font-family: "arial"; font-size: 14px; vertical-align: middle; border-top-width: 1px; border-top-color: #f6f6f6; border-top-style: solid; margin: 0; padding: 9px 0; font-weight:bold;" width="80%">Total</td><td style="font-family: "arial"; font-size: 14px; vertical-align: middle; border-top-width: 1px; border-top-color: #f6f6f6; border-top-style: solid; margin: 0; padding: 9px 0; font-weight:bold;" align="right">€ '+ amount +'</td></tr></tbody></table></div></td></tr><tr><td colspan="2"><center></center><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited.</p></div></div></div></body>'
        };


        // Invoice
        transporter.sendMail(invoice, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
        }); 
        
        transporter.sendMail(applyMail, (error, info) => {
           if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
        }); 
         
        
    });



//Handle Contact Message to Student
    goziextech.post('/ride', function(req, res, next){

        //Declare Variables
        var stdntfnmae = req.body.first_name;
        var stdntlname = req.body.last_name;
        var stdnteml = req.body.email;
        
        let taxiMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: stdntfnmae + ' you requested a ride' ,
            text: 'Your ride is on the way', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8;"><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +'</b><p>We recieved your request for a ride, as soon as you complete your location and pick up details on the uber platform, Uber takes it up from there and we hope you enjoy your ride, however if you did not complete your booking with uber you can do it now </p><center><a href="https://m.uber.com/ul/?action=setPickup&client_id=VhepL7PPqkD2ClkUvOTgxb8_OJiexB6z&pickup=my_location&dropoff[formatted_address]=Budapest%2C%20Hungary&dropoff[latitude]=47.497912&dropoff[longitude]=19.040235" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Get your ride </a></center><p>Study in Budapest partners and leaverages Uber Technologies as one of the leading taxi technology company in the world and we believe in using technology to solve problems for international students.</p><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration:underline;">Unsubscribe</a> </p></div></div></div></body>'
        };
        
        
        transporter.sendMail(taxiMail, (error, info) => {
           if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
        }); 
         
        
    });

   //Handle Contact Message to Student
    goziextech.post('/help', function(req, res, next){

        //Declare Variables
        var stdntfnmae = req.body.first_name;
        var stdntlname = req.body.last_name;
        var stdnteml = req.body.email;
        var stdntmsg = req.body.message;
        var subject = req.body.subject;
        
        let helpMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: stdntfnmae + ' you asked for help!' ,
            text: 'You asked for help!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8;"><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +'</b><p>Hang in there for a sec, a Studyinbudapest representative will provide answer to your question on <b>'+ subject +'</b><br> However, while you wait for quick help could you</p><center><a href="http://help.studyinbudapest.com" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Lookup Answers </a></center><p>If you need to speak to a representative , you can reach us at +1 (201) - 992- 1664</p><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration:underline;">Unsubscribe</a> </p></div></div></div></body>'
        };
        
        
        transporter.sendMail(helpMail, (error, info) => {
           if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
        }); 
         
        
    });


 //Handle Contact Message to Student
    goziextech.post('/visa', function(req, res, next){

        //Declare Variables
        var stdntfnmae = req.body.first_name;
        var stdntlname = req.body.last_name;
        var stdnteml = req.body.email;
        var embassy = req.body.embassy;
        if (embassy == "others"){
         var embassy = "in your country";   
        } else {
          var embassy = req.body.embassy;  
        }
        
        let visaAppointmentMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: stdntfnmae + ' ' + stdntlname + ' Visa Appointment Confirmation!' ,
            text: 'Confirm your appointment!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8;"><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +'</b><p>To complete your student visa interview booking for the hungarian embassy in your country simply use the following button:</p><center><a href="https://ifr.mfa.gov.hu/Idopontfoglalas/Pages/Idopontfoglalas.aspx" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Select interview date </a></center><p>Study in Budapest connects you with universities and makes it easy for you to apply for admission to one university and get recruited by multiple universities, travel, visa, and city guide in one app.<br><br> If you need to speak to a representative , you can reach us at +1 (201) - 992- 1664</p><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration:underline;">Unsubscribe</a> </p></div></div></div></body>'
        };
        
        
        transporter.sendMail(visaAppointmentMail, (error, info) => {
           if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
        }); 
         
        
    });


   //Handle Contact Message to Student
    goziextech.post('/docucheck', function(req, res, next){
    
        //Declare Variables
        var stdntfnmae = req.body.first_name;
        var stdntlname = req.body.last_name;
        var stdnteml = req.body.email;
        var checkingtype = req.body.checkingtype;
      
        
        let docuCheckMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: stdntfnmae + ' You requested a document verification!' ,
            text: 'Your requested a document verification!', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8;"><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +'</b><p>We have received your visa eligibility check, our legal experts and professionals will have a look at your documents and send you an email on your eligibility and your chances of getting a student visa, if you will like to try your knowledge on questions the embassy may ask, you can use the visa section of our app </p><center><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Take Practise Test </a></center><p>Study in Budapest connects you with universities and makes it easy for you to apply for admission to one university and get recruited by multiple universities, travel, visa, and city guide in one app.<br><br> If you need to speak to a representative , you can reach us at +1 (201) - 992- 1664</p><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration:underline;">Unsubscribe</a> </p></div></div></div></body>'
        };
        
        
        transporter.sendMail(docuCheckMail, (error, info) => {
           if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
        }); 
         
        
    });

    //Handle Contact Message to Student
    goziextech.post('/checkstatus', function(req, res, next){

        //Declare Variables
        var stdntfnmae = req.body.first_name;
        var stdnteml = req.body.email;
        var uvrstynm = req.body.university;
        var course = req.body.course;
        var applicationportal = "http://www.studyinbudapest.com/search-universities";
        
        if (uvrstynm == "Mcdaniels College"){
         var universityemail = "mcdaniels@studyinbudapest.com";
            
        } else if (uvrstynm == "Budapest Metropolitan") {
         var universityemail = "metropolitan@studyinbudapest.com";
            
        }else if (uvrstynm == "Eotvos Lorand University") {
         var universityemail = "elte@studyinbudapest.com";  
            
        }else if (uvrstynm == "International Business School") {
         var universityemail = "ibs@studyinbudapest.com"; 
            
        }else if (uvrstynm == "Budapest Arts & Design University") {
         var universityemail = "mome@studyinbudapest.com"; 
            
        }else if (uvrstynm == "Semmelweis Medical University") {
         var universityemail = "semmelweis@studyinbudapest.com"; 
            
        }else if (uvrstynm == "BME Science and Economics") {
         var universityemail = "bme@studyinbudapest.com";
            
        }else if (uvrstynm == "Corvinus University") {
         var universityemail = "corvinus@studyinbudapest.com";
            
        }else if (uvrstynm == "Budapest University of Science") {
         var universityemail = "bgf@studyinbudapest.com";   
            
        } else if (uvrstynm == "Central European University") {
         var universityemail = "ceu@studyinbudapest.com";    
        }else {
          var universityemail = "admissions@studyinbudapest.com";  
        }
       
        let statusMail = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: stdntfnmae + ' continue your application' ,
            text: 'Continue your application', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8;"><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ stdntfnmae +'</b><p> Here is how you can check the status of your application to study '+ course +' at '+ uvrstynm +', you can email the university or click on the continue button, please make sure that you complete the university registration form as well, if you do not complete the registration form on the university website or portal, your application will not be completely processed by the university, if you skipped this step or abandoned the university form on their website, you can continue here</p><center><a href="'+ applicationportal +'" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Continue Application</a></center><center><a href="mailto:'+ universityemail +'" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #32CD32; border-radius: 60px; text-decoration:none;"> Email the university</a></center><p>Study in Budapest connects you with universities and makes it easy for you to apply for admission to one university and get recruited by multiple universities, travel, visa, and city guide in one app.</p><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration:underline;">Unsubscribe</a> </p></div></div></div></body>'
        };

        transporter.sendMail(statusMail, (error, info) => {
           if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
        }); 
    });
     //Travel Message
     goziextech.post('/trvl/msg', ensureAuthenticated,function(req, res, next){

        var stdnteml = req.body.studentemail;
        var fname = (req.body.studentname).toUpperCase();
        var admsnofcr = req.body.admsnofcr;
        var uvrstynm = req.body.universityname; 

        // setup email data with unicode symbols

        let TravelMessage = {

        from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject: fname + ' You Recieved a Travel Assistance Package' , // Subject line // or a university sent you a message
            text: 'Travel Recieved', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>Hi '+ fname +',</b><center><p>'+ admsnofcr +' from '+ uvrstynm +' has just sent you the following travel services</p></center><center><img src="http://www.studyinbudapest.com/images/emailassets/aiport-taxi-em-study-in-budapest-study-in-europe-mobile-app-img1%20copy.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Book Airport Taxi </a></center><center><center><img src="http://www.studyinbudapest.com/images/emailassets/student-accomodation-hostel-em-study-in-budapest-study-in-europe-mobile-app-img1%20copy.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Find Accommodation </a></center><center><img src="http://www.studyinbudapest.com/images/emailassets/student-flights-em-study-in-budapest-study-in-europe-mobile-app-img1%20copy.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Book Cheap Flight </a></center><center><img src="http://www.studyinbudapest.com/images/emailassets/student-travel-em-study-in-budapest-study-in-europe-mobile-app-image.jpg" alt="Studyinbudapest" style="border:none; display:block; width:10%"><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Travel Insurance </a></center>     </center><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>'

        };

        // send mail with defined transport object
        transporter.sendMail(TravelMessage, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
                  //console.log("Travel Message Sent");
            }
           
        }); 
         
    });


    //Travel Message
         goziextech.post('/tvap/msg', ensureAuthenticated, function(req, res, next){

        var stdnteml = req.body.studentemail;
        var uvrstynm = req.body.universityname; 

        // setup email data with unicode symbols

        let TvapMessage = {

        from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: stdnteml, // list of receivers
            subject:' You Recieved a Travel Assistance Package' , // Subject line // or a university sent you a message
            text: 'Travel Recieved', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>Hi,</b><center><p>'+ uvrstynm +' has just sent you the following travel services</p></center><center><img src="http://www.studyinbudapest.com/images/emailassets/aiport-taxi-em-study-in-budapest-study-in-europe-mobile-app-img1%20copy.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Book Airport Taxi </a></center><center><center><img src="http://www.studyinbudapest.com/images/emailassets/student-accomodation-hostel-em-study-in-budapest-study-in-europe-mobile-app-img1%20copy.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Find Accommodation </a></center><center><img src="http://www.studyinbudapest.com/images/emailassets/student-flights-em-study-in-budapest-study-in-europe-mobile-app-img1%20copy.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Book Cheap Flight </a></center><center><img src="http://www.studyinbudapest.com/images/emailassets/travel-em-study-in-budapest-study-in-europe-mobile-app-image.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"><a href="http://www.studyinbudapest.com/download-api" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> Travel Insurance </a></center>     </center><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>'

        };

        // send mail with defined transport object
        transporter.sendMail(TvapMessage, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(TvapMessage);
        });    
    });

     //Verify Message Welcome
         goziextech.post('/verify/wmsg', function(req, res, next){

        var fname = (req.body.first_name).toUpperCase();
        var lname = req.body.last_name;
        var uvrstynm = req.body.university;
        var uvstem = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        var country = req.body.country;

        // setup email data with unicode symbols

        let verifyMailOptions = {

        from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: uvstem, // list of receivers
            subject: fname + ' please verify your '+ uvrstynm +' account' , // Subject line // or a university sent you a message
            text: 'Verify your account', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><center><p>Please verify your email address to activate your account</p></center><center><a href="http://localhost:3000/#/verify/'+ uvstem +'" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background:#00BF4B; border-radius: 60px; text-decoration:none;"> Verfiy your email</a></center><center><b>Are you '+ uvrstynm +' verification steps ?</b></center> As part of our data privacy and user protection, your account will need further verification to confirm if you are a university.<br> <br> <b>Step 1:</b> We will give your university a call on the number you provided on registration <br><b>Step 2:</b> We will send an email to your university admission email address to confirm if it is functional and truly owned by a university <br><br>   You can start using your account, as soon as we finish our verification, usually by phone or email.<br>Be sure, we will be in touch soon, In the mean time, should you have need to speak to us or if your information is taking longer than usual to be verified, please contact support: <b>1 (201) 992-1664 </b><center><a href="mailto:admissions@studyinbudapest.com" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background:#1e88e5; border-radius: 60px; text-decoration:none;"> Check verification status</a><br></center><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a></p></div></div></div></body>'

        };

        // send mail with defined transport object
        transporter.sendMail(verifyMailOptions, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(verifyMailOptions);
        });    
    });


    //Message Welcome
    goziextech.post('/uni/wmsg', function(req, res, next){  
        var fname = (req.body.first_name).toUpperCase();
        var lname = req.body.last_name;
        var uvrstynm = req.body.university;
        var uvstem = req.body.email;
        var username = uvstem;
        var password = req.body.password;
        var country = req.body.country;

        let mailOptions = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: uvstem, // list of receivers
            subject: fname + ' Welcome to Study in Budapest' , // Subject line // or a university sent you a message
            text: 'Welcome to Studyinbudapest', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ fname +',</b><center><p>Welcome to Studyinbudapest meet your dashboard, your one stop recruitment easy to use tool, you can now start recruiting international students for free </p></center><center><p>Your username is: <strong>'+ username +'</strong></p><p>Password: <strong>'+ password +'</strong></p></center><center><img src="http://www.studyinbudapest.com/images/emailassets/university%20dasboard%202018.png" style="display:block; width:50%"></center><center><a href="index.html" style="display: inline-block; padding: 11px 30px; margin: 20px 0px 30px; font-size: 15px; color: #fff; background: #1e88e5; border-radius: 60px; text-decoration:none;"> View Applicants & Recruit </a></center><center><p>Every week international students are applying to other universities in your area and you can recruit them for FREE</p></center><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited <br><a href="javascript: void(0);" style="color: #b2b2b5; text-decoration: underline;">Unsubscribe</a> </p></div></div></div></body>'

        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(mailOptions);
        });
    //res.end();

    });

   //Handle Recruit Messages
    goziextech.post('/invoice', ensureAuthenticated, function(req, res, next){

        
        //Declare Variables
        var universityname = req.body.universityname;
        var universityemail = req.body.universityemail;
        var plan = req.body.plan;
        var amount = req.body.amount; 
        var date = req.body.date;
        
        // setup email data with unicode symbols
        let invoice = {
            from: '"Studyinbudapest Mobile App" <admissions@studyinbudapest.com', // sender address
            to: universityemail, // list of receivers
            subject: ' Payment Reciept' , // Subject line // or a university sent you a message
            text: 'Your invoice is enclosed', // plain text body
            html: '<body style="margin:0px; background: #f8f8f8; "><div width="100%" style="background: #f8f8f8; padding: 0px 0px; font-family:arial; line-height:28px; height:100%;  width: 100%; color: #514d6a;"><div style="max-width: 700px; padding:50px 0;  margin: 0px auto; font-size: 14px"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 20px"><tbody><tr><td style="vertical-align: top; padding-bottom:30px;" align="center"><a href="javascript:void(0)" target="_blank"><img src="http://www.studyinbudapest.com/images/study-in-budapest-mobile-app-icon-study-abroad-european-universities-round.png" alt="Studyinbudapest" style="border:none; display:block; width:10%"></td></tr></tbody></table><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td style="background:#1e88e5; padding:20px; color:#fff; text-align:center;"> Goziex Technologies Limited </td></tr></tbody></table><div style="padding: 40px; background: #fff;"><table border="0" cellpadding="0" cellspacing="0" style="width: 100%;"><tbody><tr><td><b>'+ universityname +'</b><p style="margin-top:0px;">Invoice</p></td><td align="right" width="100"> '+ date +'</td></tr><tr><td colspan="2" style="padding:20px 0; border-top:1px solid #f6f6f6;"><div><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td style="font-family: "arial"; font-size: 14px; vertical-align: middle; margin: 0; padding: 9px 0;">'+ plan +'</td><td style="font-family: "arial"; font-size: 14px; vertical-align: middle; margin: 0; padding: 9px 0;"  align="right">€ '+ amount +'</td></tr><tr class="total"> <td style="font-family: "arial"; font-size: 14px; vertical-align: middle; border-top-width: 1px; border-top-color: #f6f6f6; border-top-style: solid; margin: 0; padding: 9px 0; font-weight:bold;" width="80%">Total</td><td style="font-family: "arial"; font-size: 14px; vertical-align: middle; border-top-width: 1px; border-top-color: #f6f6f6; border-top-style: solid; margin: 0; padding: 9px 0; font-weight:bold;" align="right">€ '+ amount +'</td></tr></tbody></table></div></td></tr><tr><td colspan="2"><center></center><b>- Thanks Studyinbudapest</b> </td></tr></tbody></table></div><div style="text-align: center; font-size: 12px; color: #b2b2b5; margin-top: 20px"><p> Powered by Goziex Technologies Limited.</p></div></div></div></body>'
        };

        // send mail with defined transport object
        transporter.sendMail(invoice, (error, info) => {
            if (error) {
                //res.send(500);
                return console.log(error);
            } else {
                  res.sendStatus(200);
            }
            console.log('Message sent: %s', info.messageId);
            console.log(invoice);
        }); 
    });


     process.on('uncaughtException', function (err) {
     return console.log(err);
     });

    goziextech.listen(3000);
    console.log('Goziex Tech Server is running on port:' + port);