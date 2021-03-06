//
// Copyright (c) 2013 Jean Alexandre Iragne (https://github.com/Iragne)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

var crypto = require('crypto'),
    database =  require('../db.js'),
    env = require("../env.js"),
    config = require("../../conf.js");


module.exports = function (app,DB){
	var login_action = function (login,passe,callback){
       if (login == null || passe == null)
           return callback(false,0);
        database.Users.find({ where: {active:"1",username: login,password:crypto.createHash('sha1').update(passe).digest('hex')} }).success(function(user) {
            callback(user != null,user);
        }).error(function (e){
            env.log.info("error");
            env.log.info(e);
            callback(false,0);
        });
        
    };


    app.post('/admin/auth/login', function (req, res) {
        login = req.body.login.replace(/\W/g, '');
        passe = req.body.password.replace(/\W/g, '');
        login_action(login,passe,function (respond,user){
            if(respond){
              req.session.auth = {client:user.ClientId,user:user};
              res.redirect('/admin/apps/'+user.ClientId);
            }else
              res.render('auth/login', respond);
        });
    });
    app.get('/admin/auth/login', function (req, res) {
        login_action(null,null,function (respond){
            res.render('auth/login', respond);
        });
    });

    app.get('/admin/users/del/:userid', function (req, res) {
        var userid = req.params.userid.replace(/\W/g, '');
        database.Users.find(userid).success(function(user){
            if (user && userid != 1){
                user.destroy().success(function () {
                });
            }
            res.redirect('/admin/users/'+req.session.auth.client);
        });
    });

    app.get('/admin/users/details/:userid', function (req, res) {
        var userid = req.params.userid.replace(/\W/g, '');
        database.Users.find(userid).success(function(user){
            res.render('users/add', {flux:user,session:req.session.auth});
        });
    });

    app.post('/admin/users/add', function (req, res) {
        var data = req.body.user;
        data.ClientId = req.session.auth.client;
        console.log(data)
        data.active = parseInt(data.active);
        if (data.password && data.password.length > 0){
            if (data.password.length > 4){
                data.password = crypto.createHash('sha1').update(data.password).digest('hex')
            }else{
                return res.render('users/add', {flux:user,session:req.session.auth,error:"Passwords must be at least 5 characters"});
            }
        }else{
            delete data.password
        }
        database.Users.build(data).saveorupdate(function(model){
            return res.redirect('/admin/users/'+req.session.auth.client);
        });
    });
    

    app.get('/admin/users/add', function (req, res) {
        res.render('users/add', {flux:{},session:req.session.auth});
    });



    
    app.get('/admin/users/:client', function (req, res) {
        var client = req.params.client.replace(/\W/g, '');
        
        database.Users.findAll({where:{ClientId:req.session.auth.client}}).success(function(users){
           res.render('users/list', {flux:users,session:req.session.auth});
        });
    });
    
    app.get('/admin/auth/logout', function (req, res) {
        if (req.session)
          req.session.destroy();
        return res.redirect('/admin/auth/login');
    });

    

}