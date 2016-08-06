var BaseView = require('../base');

module.exports = BaseView.extend({
  className: 'home_index_view',

  getTemplateData: function() {
    return {
      count: this.app.get('session').count
    };
  }
});
module.exports.id = 'home/index';
