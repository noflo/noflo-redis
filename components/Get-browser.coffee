noflo = require 'noflo'

class Get extends noflo.AsyncComponent
  constructor: ->
    @inPorts = new noflo.InPorts
      key:
        datatype: 'string'
      url:
        datatype: 'string'
    @outPorts = new noflo.OutPorts
      out:
        datatype: 'string'
      error:
        datatype: 'object'

    super 'key', 'error'

  doAsync: (key, callback) ->
    @outPorts.error.send new Error 'Not yet supported in browser'
    callback()

exports.getComponent = -> new Get
