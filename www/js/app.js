// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova', 'ngStorage', 'ui.utils.masks'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

  $ionicConfigProvider.tabs.position('bottom'); 
  
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'TabsCtrl'
  })

  // Each tab has its own nav history stack:

  .state('tab.inicio', {
    url: '/inicio',
    views: {
      'tab-inicio': {
        templateUrl: 'templates/tab-inicio.html',
        controller: 'InicioCtrl'
      }
    }
  })

  .state('tab.entrada', {
      url: '/entrada',
      views: {
        'tab-entrada': {
          templateUrl: 'templates/tab-entrada.html',
          controller: 'EntradaCtrl'
        }
      }
    })
    
    .state('tab.despesa', {
      url: '/despesa',
      views: {
        'tab-despesa': {
          templateUrl: 'templates/tab-despesa.html',
          controller: 'DespesaCtrl'
        }
      }
    })

  .state('tab.caixa', {
    url: '/caixa',
    views: {
      'tab-caixa': {
        templateUrl: 'templates/tab-caixa.html',
        controller: 'CaixaCtrl'
      }
    }
  })

  .state('tab.configuracoes', {
    url: '/configuracoes',
    views: {
      'tab-configuracoes': {
        templateUrl: 'templates/tab-configuracoes.html',
        controller: 'ConfiguracoesCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/inicio');

})

.directive("moveNextOnMaxlength", function() {
    return {
        restrict: "A",
        link: function($scope, element) {
            element.bind("keyup", function(e) {
                if(element.val().length == element.attr("maxlength")) {
                    var $nextElement = element.next();
                    if($nextElement.length) {
                        $nextElement[0].focus();
                    }
                }
            });
        }
    }
})

.directive("actionOnMaxlength", function() {
    return {
        restrict: "A",
        link: function($scope, element) {
            element.bind("keyup", function(e) {
                if(element.val().length == element.attr("maxlength")) {
                    $scope[element.attr("action")]();
                }
            });
        }
    }
});
