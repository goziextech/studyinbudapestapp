//npm install gulp --save
//npm install gulp -g --save
//npm install gulp-nodemon

var gulp = require('gulp'),
nodemon = require('gulp-nodemon');
//npm install gulp-nodemon --save

gulp.task('default', function(){
 //gulp needs a json object to configure itself   
    nodemon({
        
        script: 'app.js',
        ext: '.js',// gulp needs to watch for an extension
        env: {
            PORT:8000 //set different to let you know where its coming from
        },
        
        ignore: ['./node_modules/**']
    })
    .on('restart', function (){
        
        console.log('Restarting');
    });
    
    
});

//Setting up Gulp: after installation, in your package.json it should come up in dependecies and install it global to have access it in the command line and the install the plugin gulp nodemon

// Type just gulp to run, enter into app.js file Gulp is running my app on Port + port, check the student.js file created with this