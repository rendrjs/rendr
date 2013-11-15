module.exports = function(Handlebars) {

var templates = {};

templates["home/index"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, options, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;


  buffer += "<h1>Wecome to GitHub Browser!</h1>\n<p>This is a little app that demonstrates how to use Rendr by consuming GitHub's public Api.</p>\n<p>Check out <a href=\"/repos\">Repos</a> or <a href=\"/users\">Users</a>.</p>\n\n<p>";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.copyright || depth0.copyright),stack1 ? stack1.call(depth0, "2013", options) : helperMissing.call(depth0, "copyright", "2013", options)))
    + "</p>\n";
  return buffer;
  });

templates["repos/index"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n  <li>\n    <a href=\"/repos/"
    + escapeExpression(((stack1 = ((stack1 = depth0.owner),stack1 == null || stack1 === false ? stack1 : stack1.login)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</a>, by <a href=\"/users/"
    + escapeExpression(((stack1 = ((stack1 = depth0.owner),stack1 == null || stack1 === false ? stack1 : stack1.login)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.owner),stack1 == null || stack1 === false ? stack1 : stack1.login)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a>\n  </li>\n";
  return buffer;
  }

  buffer += "<h1>Repos</h1>\n\n<ul>\n";
  stack1 = helpers.each.call(depth0, depth0.models, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n";
  return buffer;
  });

templates["repos/show"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n  <br>\n  <p><a href=\"https://travis-ci.org/"
    + escapeExpression(((stack1 = ((stack1 = depth0.owner),stack1 == null || stack1 === false ? stack1 : stack1.login)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "/";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "/builds/"
    + escapeExpression(((stack1 = ((stack1 = depth0.build),stack1 == null || stack1 === false ? stack1 : stack1.last_build_id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">Latest TravisCI build</a></p>\n";
  return buffer;
  }

  buffer += "<a href=\"/users/"
    + escapeExpression(((stack1 = ((stack1 = depth0.owner),stack1 == null || stack1 === false ? stack1 : stack1.login)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.owner),stack1 == null || stack1 === false ? stack1 : stack1.login)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</a> / ";
  if (stack2 = helpers.name) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.name; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "<br>\n\n\n";
  stack2 = helpers['if'].call(depth0, ((stack1 = depth0.build),stack1 == null || stack1 === false ? stack1 : stack1.last_build_id), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n<h3>Stats</h3>\n<div class=\"row\">\n  <div class=\"col-lg-6 col-md-6 col-sm-6\">\n    <table class=\"table\">\n      <tr>\n        <th>Description</th>\n        <td>";
  if (stack2 = helpers.description) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.description; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n      </tr>\n      <tr>\n        <th>Language</th>\n        <td>";
  if (stack2 = helpers.language) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.language; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n      </tr>\n      <tr>\n        <th>Watchers</th>\n        <td>";
  if (stack2 = helpers.watchers_count) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.watchers_count; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n      </tr>\n      <tr>\n        <th>Forks</th>\n        <td>";
  if (stack2 = helpers.forks_count) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.forks_count; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n      </tr>\n      <tr>\n        <th>Open Issues</th>\n        <td>";
  if (stack2 = helpers.open_issues_count) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.open_issues_count; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n      </tr>\n    </table>\n  </div>\n</div>\n";
  return buffer;
  });

templates["user_repos_view"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <tr>\n      <td><a href=\"/repos/";
  if (stack1 = helpers.full_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.full_name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a></td>\n      <td>";
  if (stack1 = helpers.watchers_count) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.watchers_count; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td>\n      <td>";
  if (stack1 = helpers.forks_count) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.forks_count; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td>\n    </tr>\n  ";
  return buffer;
  }

  buffer += "<h3>Repos</h3>\n<table class=\"repos-table table\">\n  <thead>\n    <tr>\n      <th>Name</th>\n      <th>Watchers</th>\n      <th>Forks</th>\n    </tr>\n  </thead>\n  <tbody>\n  ";
  stack1 = helpers.each.call(depth0, depth0.models, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </tbody>\n</table>\n";
  return buffer;
  });

templates["users/index"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <li>\n    <a href=\"/users/";
  if (stack1 = helpers.login) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.login; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.login) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.login; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a>\n  </li>\n";
  return buffer;
  }

  buffer += "<h1>Users</h1>\n\n<ul>\n";
  stack1 = helpers.each.call(depth0, depth0.models, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n";
  return buffer;
  });

templates["users/show"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


  buffer += "<img src=\"";
  if (stack1 = helpers.avatar_url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.avatar_url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" width=80 height=80> ";
  if (stack1 = helpers.login) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.login; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " (";
  if (stack1 = helpers.public_repos) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.public_repos; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " public repos)\n\n<br>\n\n<div class=\"row\">\n  <div class=\"col-lg-6 col-md-6 col-sm-6\">\n    ";
  options = {hash:{
    'collection': (depth0.repos)
  },data:data};
  buffer += escapeExpression(((stack1 = helpers.view || depth0.view),stack1 ? stack1.call(depth0, "user_repos_view", options) : helperMissing.call(depth0, "view", "user_repos_view", options)))
    + "\n  </div>\n\n  <div class=\"col-lg-6 col-md-6 col-sm-6\">\n    <h3>Info</h3>\n    <br>\n    <table class=\"info-table table\">\n      <tr>\n        <th>Location</th>\n        <td>";
  if (stack2 = helpers.location) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.location; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n      </tr>\n      <tr>\n        <th>Blog</th>\n        <td>";
  if (stack2 = helpers.blog) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.blog; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n      </tr>\n    </table>\n  </div>\n</div>\n";
  return buffer;
  });

templates["users/show_lazy"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, stack2, options, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


  buffer += "<img src=\"";
  if (stack1 = helpers.avatar_url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.avatar_url; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" width=80 height=80> ";
  if (stack1 = helpers.login) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.login; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " (";
  if (stack1 = helpers.public_repos) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.public_repos; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " public repos)\n\n<br>\n\n<div class=\"row\">\n  <div class=\"col-lg-6 col-md-6 col-sm-6\">\n    ";
  options = {hash:{
    'collection_name': ("Repos"),
    'param_name': ("login"),
    'param_value': (depth0.login),
    'lazy': ("true")
  },data:data};
  buffer += escapeExpression(((stack1 = helpers.view || depth0.view),stack1 ? stack1.call(depth0, "user_repos_view", options) : helperMissing.call(depth0, "view", "user_repos_view", options)))
    + "\n  </div>\n\n  <div class=\"col-lg-6 col-md-6 col-sm-6\">\n    <h3>Info</h3>\n    <br>\n    <table class=\"info-table table\">\n      <tr>\n        <th>Location</th>\n        <td>";
  if (stack2 = helpers.location) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.location; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n      </tr>\n      <tr>\n        <th>Blog</th>\n        <td>";
  if (stack2 = helpers.blog) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.blog; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n      </tr>\n    </table>\n  </div>\n</div>\n";
  return buffer;
  });

return templates;

};