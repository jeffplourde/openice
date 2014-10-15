module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'build/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    browserify: {
      dist: {
        options: {debug: true},
        src: ['src/openice.info.js'],
        dest: 'build/<%= pkg.name %>.js'
      },
      lab: {
        src: ['src/lab.js'],
        dest: 'build/lab.js'
      },
      numerics: {
        src: ['src/numerics.js'],
        dest: 'build/numerics.js'
      },
      vitals: {
        src: ['src/vitals.js','src/main.js'],
        dest: 'build/vitals.js'
      },
      usc: {
        src: ['usc/src/app.js'],
        dest: 'build/usc.js'
      },
      drew: {
        src: ['src/drew.js'],
        dest: 'build/drew.js'
      }
    },
    watch: {
        files: ["src/**/*.js", "usc/src/**/*.js"],
        tasks: ['browserify']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  // Default task(s).
  grunt.registerTask('default', ['browserify', 'uglify']);

};
