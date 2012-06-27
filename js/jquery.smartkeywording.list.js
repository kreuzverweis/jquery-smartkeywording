(function( $ ){

  var defaultOptions = {
    tokens: {
      userPath: "/users",
      userCookie: "smartkeywording_user",
      tokenPath: "/tokens",
      tokenCookie: "smartkeywording_token"
    },

    completions: {
      path: "/completions",
      lang: 'en',
      limit: 10,
      maxTries: 2
    },

    proposals: {
      path: "/proposals",
      lang: 'en',
      limit: 20,
      delay: 1000,
      maxTries: 2,
    }
  }

  var methods = {
    init: function(options) {
      return this.each(function() {
        var settings = $.extend({}, defaultOptions, options)
        settings.selection = []
        $(this).data('smartkeywording', { settings: settings });
        _authorize($(this));
      })
    },

    completions: function(prefix) {
      return this.each(function() {
        _completions($(this), prefix)
      })
    },

    deselected: function(keywords, instant) {
      return this.each(function(){
        var keywording = $(this)
        var settings = keywording.data('smartkeywording').settings;
        var cur = settings.selection
        var updated = []
        for (idx in cur) {
          if ($.inArray(cur[idx], keywords) < 0) {
            updated.push(cur[idx])
          }
        }
        settings.selection = updated
        var data = { keywords: keywords, selection: updated }
        $(this).trigger('smartkeywordingdeselected', data)
        _proposals($(this), updated, instant)
      })
    },

    selected: function(keywords, instant) {
      return this.each(function(){
        var keywording = $(this)
        var settings = keywording.data('smartkeywording').settings;
        var cur = settings.selection
        for (idx in keywords) {
          cur.push(keywords[idx])
        }
        var data = { keywords: keywords, selection: cur }
        $(this).trigger('smartkeywordingselected', data)
        _proposals($(this), cur, instant)
      })
    },

  };

  $.fn.smartkeywording = function( method ) { 
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.smartkeywording' );
    }    
  };

  function _authorize(element, force) {
    var settings = $(element).data('smartkeywording').settings
    var token = _getToken(settings.tokens, force)    
    $.extend(settings, { token: token })
  };


  function _getUser(settings) {
    if ($.cookie(settings.userCookie)) {
      return $.cookie(settings.userCookie);
    } else {
      $.ajax({
        url : settings.userPath,
        type : "POST",
        data : '',
        async : false,
        dataType : "xml",
        error : function(jqXHR, textStatus, errorThrown) {
          console.log("could not create user")
        },
        success : function(xmlResponse) {
          var userid = $('user > id', xmlResponse).text();
          $.cookie(settings.userCookie, userid, {
            path: "/"
          });
          console.log('received new userid ' + $.cookie(settings.userCookie));             
        }
      });
      return $.cookie(settings.userCookie)
    }
  }

  function _getToken(settings, force) {
    var user = _getUser(settings)
    if (!force && $.cookie(settings.tokenCookie)) {
      return $.cookie(settings.tokenCookie);
    } else {
      $.ajax({
        url : settings.userPath + "/" + user + settings.tokenPath,
        type : "POST",
        data : '',
        async : false,
        dataType : "xml",
        error : function(jqXHR, textStatus, errorThrown) {
          console.log("could not create token")
        },
        success : function(xmlResponse) {
          var token = $('token > value', xmlResponse).text();           
          $.cookie(settings.tokenCookie, token, {
            path: "/"
          });
          console.log('received new token ' + $.cookie(settings.tokenCookie));
        }
      });
      return $.cookie(settings.tokenCookie)
    }
  };

  function _error(ajax, jqXHR, textStatus, errorThrown) {
    console.log('eek')
    if (errorThrown === 'Unauthorized') {
      console.log("Requesting new token.")
      _authorize(ajax.main, true)
      ajax.headers["Authorization"] = "Bearer " + ajax.main.data('smartkeywording').settings.token
    }
    if (ajax.tries) {
      ajax.tries++;
    } else {
      ajax.tries = 1;
    }
    if (ajax.tries > ajax.maxTries) {
      ajax.main.trigger('smartkeywordingerror', {
        jqXHR: jqXHR,
        textStatus: textStatus,
        errorThrown: errorThrown
      })
    } else {
      $.ajax(ajax)
    }    
  }

  function _completions(main, prefix) {
    var settings = main.data('smartkeywording').settings
    $.ajax({
      headers: { 
        "Accept-Language": settings.completions.lang,
        "Authorization": "Bearer " + settings.token
      },
      url : settings.completions.path + "/" + encodeURIComponent(prefix) + "?limit=" + settings.completions.limit,
      dataType : "xml",
      main: main,
      maxTries: settings.completions.maxTries,
      error: function(jqXHR, textStatus, errorThrown) {
        _error(this, jqXHR, textStatus, errorThrown)
        response()
      },
      success: function(xmlResponse, jqxhr) {
        var keywords = [{value: prefix, score: 0}] 
        $("keyword", xmlResponse).each(function() {
          keywords.push( {
            value : $("label", this).text(),
            score : $("score", this).text()
          } )
        });
        main.trigger('smartkeywordingcompletions', { keywords: keywords });
      }
    })
  };

  function _proposals(main, keywords, instant) {
    var timerId = 'smartkeywording-' + main.attr('id')
    console.log('stopping timer ' + timerId)
    main.stopTime(timerId)
    // var keywordsArray = [];
    // keywords.each(function(index, value){keywordsArray[index] = encodeURIComponent(value)});
    var settings = main.data('smartkeywording').settings
    var keywordsArray = []
    for (idx in keywords) {
      keywordsArray.push(keywords[idx].label)
    }
    var keywordsPath = keywordsArray.join(',')
    var delay = settings.proposals.delay
    if (instant) {
      delay = 0
    }
    main.oneTime(delay, timerId, function() {
      console.log('timer ' + timerId + ' triggered')
      $.ajax({
        headers: { 
          "Accept-Language": settings.proposals.lang,
          "Authorization": "Bearer " + settings.token
        },
        url : settings.proposals.path + "/" + keywordsPath + "?limit=" + settings.proposals.limit,
        main: main,
        maxTries: settings.completions.maxTries,
        dataType : "xml",
        error: function(jqXHR, textStatus, errorThrown) {
          _error(this, jqXHR, textStatus, errorThrown)
        },
        success: function(xmlResponse, jqxhr) {
          var proposals = $("keyword", xmlResponse).map(function() {
            var keyword = {
              label : $("label", this).text(),
              score : $("score", this).text()
            }
            return keyword;
          })
          main.trigger('smartkeywordingproposals', { keywords: keywords, proposals: proposals })
        }
      })
    })
  };

})( jQuery );