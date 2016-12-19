module.exports = ->
  # Project configuration
  @initConfig
    pkg: @file.readJSON 'package.json'

    # Updating the package manifest files
    noflo_manifest:
      update:
        files:
          'package.json': ['graphs/*', 'components/*']

    # Browser build of NoFlo
    noflo_browser:
      build:
        files:
          'browser/redis.js': ['component.json']

    # Coding standards
    coffeelint:
      components:
        files:
          src: ['components/*.coffee']
        options:
          max_line_length:
            value: 80
            level: 'warn'

    # BDD tests on Node.js
    mochaTest:
      nodejs:
        src: ['spec/*.coffee']
        options:
          reporter: 'spec'
          require: 'coffee-script/register'
          grep: process.env.TESTS

  # Grunt plugins used for building
  @loadNpmTasks 'grunt-noflo-manifest'

  # Grunt plugins used for testing
  @loadNpmTasks 'grunt-coffeelint'
  @loadNpmTasks 'grunt-mocha-test'

  # Our local tasks
  @registerTask 'build', 'Build NoFlo for the chosen target platform', (target = 'all') =>
    @task.run 'noflo_manifest'

  @registerTask 'test', 'Build NoFlo and run automated tests', (target = 'all') =>
    @task.run 'coffeelint'
    @task.run 'noflo_manifest'
    if target is 'all' or target is 'nodejs'
      @task.run 'mochaTest'

  @registerTask 'default', ['test']
