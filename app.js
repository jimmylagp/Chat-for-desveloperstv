var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , http = require('http')
  , path = require('path')
  , faye = require('faye')
  , request = require('request')
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy;

var bayeux = new faye.NodeAdapter({
  mount:    '/faye',
  timeout:  45
});

var user = null;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new TwitterStrategy({
  consumerKey: 'Md66vEOGTDM84KdATlatA',
  consumerSecret: '9ZsjwK1gsyLzhevQ8yT8zTGS9hmgOcmIJSXPM4ctU',
  callbackURL: "http://localhost:3000/auth/twitter/callback"
},function(token, tokenSecret, profile, done) {
  user = {
    username: profile.username,
    avatar: profile._json.profile_image_url,
    link: 'http://twitter.com/' + profile.username,
    red: 'twitter',
    redId: profile._json.id_str,
    token: token,
    tokenSecret: tokenSecret
  };

  var socialPost = {
    incoming: function(message, callback) {
      if (message.channel == '/messages'){
        request.post({
            url: 'https://api.twitter.com/1.1/statuses/update.json',
            oauth: {
                consumer_key: 'Md66vEOGTDM84KdATlatA',
                consumer_secret: '9ZsjwK1gsyLzhevQ8yT8zTGS9hmgOcmIJSXPM4ctU',
                token: user.token,
                token_secret: user.tokenSecret
            },
            form: {
                status: message.data['text'] + ' #desveloperstv'
            }
        });
      }
      callback(message);
    }
  };

  bayeux.addExtension(socialPost);
	return done(null, profile);
}));

passport.use(new FacebookStrategy({
  clientID: '153280444845188',
  clientSecret: 'b20be9c89525851f67bddd6787b2bde5',
  callbackURL: "http://localhost:3000/auth/facebook/callback"
}, function(accessToken, refreshToken, profile, done) {
  user = {
    username: profile.username,
    avatar: 'https://graph.facebook.com/'+profile.username+'/picture',
    link: profile.profileUrl,
    red: 'facebook',
    redId: profile.id,
    token: accessToken,
    tokenSecret: refreshToken
  };

  var socialPost = {
    incoming: function(message, callback) {
      if (message.channel == '/messages'){
        request.post('https://graph.facebook.com/'+user.redId+'/feed?access_token='+user.token,
                  {form: { message: message.data['text'] + ' #desveloperstv'}});
      }
      callback(message);
    }
  };

  bayeux.addExtension(socialPost);
	return done(null, profile);
}));

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: "keyboard cat" }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

require('./routes')(app, passport);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

bayeux.attach(server);