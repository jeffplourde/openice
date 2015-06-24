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
      diagnostics: {
        src: ['src/diagnostics.js'],
        dest: 'build/diagnostics.js'
      },
      vitals: {
        src: ['src/vitals.js','src/main.js'],
        dest: 'build/vitals.js'
      },
      fhir: {
        src: ['src/FHIR.js'],
        dest: 'build/FHIR.js'
      },
      demoie8: {
        src: ['src/demo-ie8.js'],
        dest: 'build/demo-ie8.js'
      }
    },
    bower: {
      install: {
        options: {
          targetDir: './lib',
          cleanTargetDir: true,
          layout: 'byComponent'
        }
      }
    },
    jekyll: {
      options: {
        config: "_config.yml,_config.local.yml"
      },
      dist: {

      },
      serve: {
        options: {
          serve: true,
          watch: true
        }
      }
    },
    watch: {
        files: ["src/**/*.js"],
        tasks: ['browserify']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-jekyll');

  // Default task(s).
  grunt.registerTask('serve', ['bower', 'browserify', 'uglify', 'jekyll:serve']);
  grunt.registerTask('default', ['bower', 'browserify', 'uglify', 'jekyll:dist']);

};
