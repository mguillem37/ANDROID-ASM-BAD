// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova', 'ngCordovaOauth', 'firebase'])

  .run(['$ionicPlatform', '$ionicLoading', '$log', '$cordovaNetwork', '$cordovaSplashscreen', '$cordovaAppVersion', '$cordovaDevice','ContactsManager', 'LocalStorageAPI', '$rootScope', 'ToastManager',
    function ($ionicPlatform, $ionicLoading, $log, $cordovaNetwork, $cordovaSplashscreen, $cordovaAppVersion, $cordovaDevice, ContactsManager, LocalStorageAPI, $rootScope, ToastManager) {

      $ionicPlatform.ready(function () {

        $cordovaSplashscreen.show();

        //alert('ionic ready !')
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
          cordova.plugins.Keyboard.disableScroll(true);
        }

        if (window.StatusBar) {
          $log.info("StatusBar present !");
          // org.apache.cordova.statusbar required
          StatusBar.styleLightContent();
          StatusBar.style(3);
        } else {
          $log.info("StatusBar not present !");
        }

        // ** A l'écoute du réseau */
        $rootScope.networkOnLine = $cordovaNetwork.isOnline();

        $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
          $rootScope.networkOnLine = true;
        });

        $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
          $rootScope.networkOnLine = false;
        });

        /** Méthodes utilitaires Globales */

        $rootScope.showSendingSMSOverlay = function () {
          $ionicLoading.show({
            template: 'Envoi des SMS en cours...'
          });
        };

        $rootScope.showImportingOverlay = function () {
          $ionicLoading.show({
            template: 'Import des contacts en cours...'
          });
        };

        $rootScope.showRemovingOverlay = function () {
          $ionicLoading.show({
            template: 'Suppression des contacts en cours...'
          });
        };

        $rootScope.hideOverlay = function () {
          $ionicLoading.hide();
        };

        $rootScope.displayToast = function (msg) {
          ToastManager.displayToast(msg);
        };

        $rootScope.alertAno = function (error) {
          $rootScope.hideLoadingOverlay();
          alert(error);
        };

        $rootScope.closeModal = function () {
          $rootScope.modal.hide();
        };

        $rootScope.showModal = function () {
          $rootScope.modal.show();
        };

        $rootScope.closeParameterModal = function () {
          $rootScope.parameterModal.hide();
        };

        $rootScope.showParameterModal = function () {
          $rootScope.parameterModal.show();
        };

        /** Recherche d'information sur le device */

        $cordovaAppVersion.getVersionNumber().then(function (version) {
          $rootScope.versionNumber = version;
        });

        $cordovaAppVersion.getVersionCode().then(function (build) {
          $rootScope.versionCode = build;
        });

        $rootScope.myDevice = $cordovaDevice.getPlatform() + " - " + $cordovaDevice.getVersion() + " - " +$cordovaDevice.getModel() + " - " + $cordovaDevice.getUUID();

        /** Chargement de l'applicatif */

        //comptage du nombre d'adhérents
        $rootScope.contactsASM = [];
        ContactsManager.getAllContactASM()
          .then(function (contacts) {
            $rootScope.contactsASM = contacts;
          });

        //comptage du nombre de membre du bureau
        $rootScope.membersASM = [];
        ContactsManager.getAllBureauMemberASM()
          .then(function (members) {
            $rootScope.membersASM = members;
          });

        //On récupère le flag indiquant si le téléphone dispose de l'option SMS Security

        if (LocalStorageAPI.isLocalStorageAvailable) {
          $rootScope.SmsSecurityOptionEnable = LocalStorageAPI.isResultPresent("SMSOptionSecurity");
        };

        if ($rootScope.SmsSecurityOptionEnable === null) {
          $rootScope.SmsSecurityOptionEnable = false;
        };

      //TODO : si comptage != 0 récupèrer les stats enregistrées en locale

      //on masque le spashscreen
        $cordovaSplashscreen.hide();

      });
    }])

  .
  config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      // setup an abstract state for the tabs directive
      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html'
      })

      // Each tab has its own nav history stack:

      .state('tab.synthese', {
        url: '/synthese',
        views: {
          'tab-synthese': {
            templateUrl: 'templates/tab-synthese.html',
            controller: 'SyntheseCtrl'
          }
        }
      })

      .state('tab.administration', {
        url: '/administration',
        views: {
          'tab-administration': {
            templateUrl: 'templates/tab-administration.html',
            controller: 'AdministrationCtrl'
          }
        }

      })

      .state('tab.sms', {
        url: '/sms',
        views: {
          'tab-sms': {
            templateUrl: 'templates/tab-sms.html',
            controller: 'SmsCtrl'
          }
        }

      });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/synthese');

  });