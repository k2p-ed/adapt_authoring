// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');

  var Origin = require('coreJS/app/origin');

  var EditorView = require('editorGlobal/views/editorView');
  var EditorModel = require('editorGlobal/models/editorModel');

  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/project/views/projectDetailView');
  var ProjectDetailEditSidebarView = require('coreJS/project/views/projectDetailEditSidebarView');

  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorCourseModel = require('editorCourse/models/editorCourseModel');
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');

  var EditorPageSidebarView = require('editorPage/views/editorPageSidebarView');
  var EditorPageEditView = require('editorPage/views/editorPageEditView');
  var EditorPageEditSidebarView = require('editorPage/views/editorPageEditSidebarView');

  var EditorArticleModel = require('editorPage/models/editorArticleModel');
  var EditorArticleEditView = require('editorPage/views/editorArticleEditView');
  var EditorArticleEditSidebarView = require('editorPage/views/editorArticleEditSidebarView');

  var EditorBlockModel = require('editorPage/models/editorBlockModel');
  var EditorBlockEditView = require('editorPage/views/editorBlockEditView');
  var EditorBlockEditSidebarView = require('editorPage/views/editorBlockEditSidebarView');

  var EditorComponentModel = require('editorPage/models/editorComponentModel');
  var EditorComponentEditView = require('editorPage/views/editorComponentEditView');
  var EditorComponentEditSidebarView = require('editorPage/views/editorComponentEditSidebarView');
  var EditorComponentListView = require('editorPage/views/editorComponentListView');
  var EditorComponentListSidebarView = require('editorPage/views/editorComponentListSidebarView');

  var EditorExtensionsEditView = require('editorExtensions/views/editorExtensionsEditView');
  var EditorExtensionsEditSidebarView = require('editorExtensions/views/editorExtensionsEditSidebarView');

  var EditorConfigEditView = require('editorConfig/views/editorConfigEditView');
  var EditorConfigEditSidebarView = require('editorConfig/views/editorConfigEditSidebarView');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorConfigCollection = require('editorConfig/collections/editorConfigCollection');

  var EditorThemeTypeModel = require('editorTheme/models/editorThemeTypeModel');
  var EditorThemeCollectionView = require('editorTheme/views/editorThemeCollectionView');
  var EditorThemeCollectionSidebarView = require('editorTheme/views/editorThemeCollectionSidebarView');

  var EditorMenuSidebarView = require('editorMenu/views/editorMenuSidebarView');
  var EditorMenuSettingsEditView = require('editorMenuSettings/views/editorMenuSettingsEditView');
  var EditorMenuSettingsEditSidebarView = require('editorMenuSettings/views/editorMenuSettingsEditSidebarView');

  /**
  * Current location
  * Has the structure:
  * {
  *   course: course ID
  *   type: content type (e.g. block)
  *   id: content ID
  *   action: page action (e.g. edit)
  * }
  */
  var loc;

  function route(location) {
    loc = location
    switch (loc.type) {
      case 'article':
        if (loc.action === 'edit') {
          handleArticleEditRoute();
        }
        break;

      case 'block':
        if (loc.action === 'add') {
          handleBlockAddRoute();
        }
        if (loc.action === 'edit') {
          handleBlockEditRoute();
        }
        break;

      case 'component':
        handleComponentRoute();
        break;

      case 'settings':
        handleSettingsRoute();
        break;

      case 'config':
        handleConfigRoute();
        break;

      case 'selecttheme':
        handleThemeSelectRoute();
        break;

      case 'extensions':
        handleExtensionsRoute();
        break;

      case 'menusettings':
        handleMenuSettingsRoute();
        break;

      case 'menu':
        if(loc.action === 'edit') {
          handleMenuEditRoute();
        } else {
          handleMenuRoute();
        }
        break;

      case 'page':
        if(loc.action === 'edit') {
          handlePageEditRoute();
        } else {
          handlePageRoute();
        }
        break;
    }
  }

  /*
  * Set the page title based on location.
  * Accepts backbone model, or object like so { title: '' }
  */
  function updatePageTitle(model) {
    var titleKey;
    // get titleKey from location
    switch(loc.type) {
      case 'page':
        if(loc.action === 'edit') {
          titleKey = 'editor' + loc.type + 'settings';
          break;
        }
        // else fall to default
      default:
        titleKey = 'editor' + loc.type;
    }
    var modelTitle = model && model.get && model.get('title');
    var langString = window.polyglot.t('app.' + titleKey);

    var crumbs = ['dashboard'];
    if(loc.type !== 'menu') crumbs.push('course');
    if(loc.action === 'edit') {
      var page = getNearestPage(model);
      crumbs.push({
        title: window.polyglot.t('app.editorpage'),
        url: '#/editor/' + page.get('_courseId') + '/page/' + page.get('_id')
      });
    }
    crumbs.push({ title: langString });

    Origin.trigger('location:title:update', {
      breadcrumbs: crumbs,
      title: modelTitle || langString
    });
  }

  getNearestPage = function(model) {
    var map = {
      'component': 'components',
      'block': 'blocks',
      'article': 'articles',
      'page': 'contentObjects'
    };
    var mapKeys = Object.keys(map);
    while(model.get('_type') !== 'page') {
      var parentType = mapKeys[_.indexOf(mapKeys, model.get('_type')) + 1];
      var parentCollection = Origin.editor.data[map[parentType]];
      model = parentCollection.findWhere({ _id: model.get('_parentId') });
    }
    return model;
  }

  function getConfigModel() {
    return new EditorConfigModel({ _courseId: loc.course });
  }

  function fetchModel(model, callback) {
    model.fetch({
      success: callback,
      error: function() {
        Origin.Notify.alert({
          type: 'error',
          text: window.polyglot.t('app.errorgeneric')
        });
      }
  }

  /*
  TODO look at refactoring this
  Common tasks:
    Model
    Model.fetch
      Update title(title)
      Create form(model)
      Sidebar(form, back button)
      View(model, form)

    Move the following into helpers:
    var project = new ProjectModel({_id: loc.course});
    var configModel = new EditorConfigModel({_courseId: loc.course});
  */

  function handleArticleEditRoute() {
    fetchModel(new EditorArticleModel({ _id: loc.id }), function(model) {
      var form = Origin.scaffold.buildForm({ model: model });
      updatePageTitle(model);
      Origin.sidebar.addView(new EditorArticleEditSidebarView({ model: model, form: form }).$el);
      Origin.editingOverlay.addView(new EditorArticleEditView({ model: model, form: form }).$el);
    });
  }

  function handleBlockAddRoute() {
    var containingBlock = Origin.editor.data.blocks.findWhere({ _id: loc.id });
    var componentSelectModel = new Backbone.Model({
      title: window.polyglot.t('app.addcomponent'),
      body: window.polyglot.t('app.pleaseselectcomponent'),
      _parentId: loc.id,
      componentTypes: Origin.editor.data.componentTypes.toJSON(),
      layoutOptions: containingBlock.get('layoutOptions')
    });
    Origin.sidebar.addView(new EditorComponentListSidebarView({ model: componentSelectModel }).$el);
    Origin.editingOverlay.addView(new EditorComponentListView({ model: componentSelectModel }).$el);
  }

  function handleBlockEditRoute() {
    fetchModel(new EditorBlockModel({ _id: loc.id }), function(model) {
      var form = Origin.scaffold.buildForm({ model: blockModel });
      updatePageTitle(blockModel);
      Origin.sidebar.addView(new EditorBlockEditSidebarView({ model: blockModel, form: form }).$el);
      Origin.editingOverlay.addView(new EditorBlockEditView({ model: blockModel, form: form }).$el);
    });
  }

  function handleComponentRoute() {
    fetchModel(new EditorComponentModel({ _id: loc.id }), function(model) {
      var form = Origin.scaffold.buildForm({ model: componentModel });
      updatePageTitle(componentModel);
      Origin.sidebar.addView(new EditorComponentEditSidebarView({ model: componentModel, form: form }).$el);
      Origin.editingOverlay.addView(new EditorComponentEditView({ model: componentModel, form: form }).$el);
    });
  }

  function handleSettingsRoute() {
    fetchModel(new ProjectModel({ _id: loc.course }), function(model) {
      var form = Origin.scaffold.buildForm({ model: project });
      updatePageTitle({ title: window.polyglot.t('app.editorsettingstitle') });
      Origin.sidebar.addView(new ProjectDetailEditSidebarView({ form: form }).$el);
      Origin.editingOverlay.addView(new ProjectDetailView({ model: project, form: form }).$el);
    });
  }

  function handleConfigRoute() {
    fetchModel(getConfigModel(), function(model) {
      var form = Origin.scaffold.buildForm({ model: configModel });
      updatePageTitle({ title: window.polyglot.t('app.editorconfigtitle') });
      Origin.sidebar.addView(new EditorConfigEditSidebarView({ form: form }).$el);
      Origin.editingOverlay.addView(new EditorConfigEditView({ model: configModel, form: form }).$el);
    });
  }

  function handleThemeSelectRoute() {
    fetchModel(getConfigModel(), function(model) {
      updatePageTitle(configModel);
      var backButtonRoute = "/#/editor/" + loc.course + "/menu";
      var backButtonText = window.polyglot.t('app.backtomenu');
      if (Origin.previousLocation.route2 === "page") {
        backButtonRoute = "/#/editor/" + loc.course + "/page/" + Origin.previousLocation.route3;
        backButtonText = window.polyglot.t('app.backtopage');
      }
      Origin.sidebar.addView(new EditorThemeCollectionSidebarView().$el, {
        "backButtonText": backButtonText,
        "backButtonRoute": backButtonRoute
      });
      Origin.editingOverlay.addView(new EditorThemeCollectionView({ model: configModel }).$el);
    });
  }

  function handleExtensionsRoute() {
    updatePageTitle({ title: window.polyglot.t('app.editorextensionstitle') });
    var backButtonRoute = "/#/editor/" + loc.course + "/menu";
    var backButtonText = window.polyglot.t('app.backtomenu');
    if (Origin.previousLocation.route2 === "page") {
      backButtonRoute = "/#/editor/" + loc.course + "/page/" + Origin.previousLocation.route3;
      backButtonText = window.polyglot.t('app.backtopage');
    }
    Origin.sidebar.addView(new EditorExtensionsEditSidebarView().$el, {
      "backButtonText": backButtonText,
      "backButtonRoute": backButtonRoute
    });
    var extensionsModel = new Backbone.Model({ _id: loc.course });
    Origin.editingOverlay.addView(new EditorExtensionsEditView({ model: extensionsModel }).$el);
  }

  function handleMenuSettingsRoute() {
    fetchModel(getConfigModel(), function(model) {
      var backButtonRoute = "/#/editor/" + loc.course + "/menu";
      var backButtonText = window.polyglot.t('app.backtomenu');
      if (Origin.previousLocation.route2 === "page") {
        backButtonRoute = "/#/editor/" + loc.course + "/page/" + Origin.previousLocation.route3;
        backButtonText = window.polyglot.t('app.backtopage');
      }
      updatePageTitle({ title: window.polyglot.t('app.editormenusettingstitle') });
      Origin.sidebar.addView(new EditorMenuSettingsEditSidebarView().$el, {
        "backButtonText": backButtonText,
        "backButtonRoute": backButtonRoute
      });
      Origin.editingOverlay.addView(new EditorMenuSettingsEditView({ model: configModel }).$el);
    });
  }

  function handleMenuRoute() {
    // If loc.id is an id set it to the currentContentObjectId
    Origin.editor.currentContentObjectId = (loc.id) ? loc.id : undefined;
    Origin.editor.scrollTo = 0;

    fetchModel(new EditorCourseModel({ _id: loc.course }), function(model) {
      updatePageTitle(courseModel);
      Origin.sidebar.addView(new EditorMenuSidebarView().$el, {
        "backButtonText": window.polyglot.t('app.backtocourses'),
        "backButtonRoute": Origin.dashboardRoute || '/#/dashboard'
      });
      Origin.router.createView(EditorView, {
        currentCourseId: loc.course,
        currentView: 'menu',
        currentPageId: (loc.id || null)
      });
    });
  }

  function handleMenuEditRoute() {
    fetchModel(new EditorContentObjectModel({ _id: loc.id }), function(model) {
      var form = Origin.scaffold.buildForm({ model: contentObjectModel });
      updatePageTitle(contentObjectModel);
      Origin.sidebar.addView(new EditorPageEditSidebarView().$el);
      Origin.editingOverlay.addView(new EditorPageEditView({ model: contentObjectModel, form: form }).$el);
    });
  }

  function handlePageRoute() {
    fetchModel(new EditorContentObjectModel({ _id: loc.id }), function(model) {
      updatePageTitle(contentObjectModel);
      Origin.sidebar.addView(new EditorPageSidebarView().$el, {
        "backButtonText": window.polyglot.t('app.backtocoursestructure'),
        "backButtonRoute": "/#/editor/" + loc.course + "/menu"
      });
      Origin.router.createView(EditorView, {
        currentCourseId: loc.course,
        currentView: 'page',
        currentPageId: (loc.id || null)
      });
    });
  }

  function handlePageEditRoute() {
    fetchModel(new EditorContentObjectModel({ _id: loc.id }), function(model) {
      var form = Origin.scaffold.buildForm({ model: contentObjectModel });
      updatePageTitle(contentObjectModel);
      Origin.sidebar.addView(new EditorPageEditSidebarView({ form: form }).$el);
      Origin.editingOverlay.addView(new EditorPageEditView({ model: contentObjectModel, form: form }).$el);
    });
  }

  /**
  * Exports
  */
  return {
    route: route
  };
});
