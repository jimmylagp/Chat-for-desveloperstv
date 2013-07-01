module.exports = function (app, passport) {
  app.get('/', function(req, res){
    if(typeof req.user !== "undefined"){
      var user = null;
      if(req.user.provider == 'twitter'){
        user = {
          username: req.user.username,
          avatar: req.user._json.profile_image_url,
          link: 'http://twitter.com/' + req.user.username,
          red: 'twitter'
        };
      }

      if(req.user.provider =='facebook'){
        user = {
          username: req.user.username,
          avatar: 'https://graph.facebook.com/'+req.user.username+'/picture',
          link: req.user.profileUrl,
          red: 'facebook'
        };
      }
    }
    res.render('index',{users: user});
  });
  // Auth Twitter
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/' }));

  // Auth Facebook
  app.get('/auth/facebook', passport.authenticate('facebook'));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/' }));

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });
}