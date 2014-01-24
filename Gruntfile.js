var yuidoc2md = require("yuidoc2md");

module.exports = function(grunt){
    grunt.initConfig({
        boil: {
            readme: {
                create: { 
                    filename: "README.md",
                    templateFile: "boil/readme.hbs",
                    templateData: {
                        APIdocs: yuidoc2md.getMarkdown("lib/handbrake.js")
                    }
                }
            }
        }
    });
    
    grunt.loadNpmTasks("grunt-boil");    
    grunt.registerTask("default", "boil");
};
