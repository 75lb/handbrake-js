var yuidoc2md = require("yuidoc2md");

module.exports = function(grunt){
    grunt.initConfig({
        boil: {
            readme: {
                options: {
                    templateData: {
                        APIdocs: yuidoc2md.getMarkdown("lib/handbrake.js")
                    }
                },
                create: { 
                    name: "README.md",
                    content: grunt.file.read("boil/readme.hbs")
                }
            }
        }
    });
    
    grunt.loadNpmTasks("grunt-boil");    
    grunt.registerTask("default", "boil");
};
