angular.module('starter.controllers', [])


  .controller('SyntheseCtrl', ['$scope', function ($scope) {
  }])

  .controller('AdministrationCtrl', function ($rootScope, $scope, $ionicModal, $cordovaSms, $cordovaToast, $cordovaDialogs, $log, $http, $q, ContactsManager, ToastManager, SmsManager) {

    $scope.settings = {
      enableContact: false
    };

    $scope.isDisabledImport = function () {
      return !($scope.settings.enableContact && $rootScope.contactsASM.length === 0);
    };

    $scope.isDisabledDelete = function () {
      return !($scope.settings.enableContact && $rootScope.contactsASM.length > 0)
    };

    $scope.processAfterRemove = function (contactsRemoved) {
      $rootScope.hideOverlay();
      $rootScope.displayToast(contactsRemoved.length + ' contacts ASM ont été supprimés.');
    };

    $scope.removeContacts = function () {

      //On commence par demander la confirmation à l'utilisateur
      $cordovaDialogs.confirm('Confirmez-vous la suppression des contacts de l\'ASM ?', 'Attention', ['Confirmer', 'Annuler']).then(
        function (choix) {
          // Choix -> Integer: 0 - no button, 1 - button 1, 2 - button 2
          if (choix === 1) {

            $rootScope.showRemovingOverlay();
            //extraction des contacts ayant comme Organisation ASM Badminton
            ContactsManager.removeAllContactsASM()
              .then($scope.processAfterRemove)
              .then($scope.countContactAgain)
              .catch($rootScope.alertAno);

          } //fin choix
        });

    };

    $scope.countContactAgain = function () {

      //on recompte les membres
      ContactsManager.getAllContactASM()
        .then(function (contacts) {
          $rootScope.contactsASM = contacts;
        });

      //on recompte les membre du bureau
      ContactsManager.getAllBureauMemberASM()
        .then(function (membersImported) {
          $rootScope.membersASM = membersImported;
        })

    };

    $scope.processAfterImport = function (contactAdded) {
      $rootScope.hideOverlay();
      $rootScope.displayToast(contactAdded.length + ' contacts ASM ont été importés.');
    };

    $scope.importContacts = function () {

      //On commence par demander la confirmation à l'utilisateur
      $cordovaDialogs.confirm('Confirmez-vous l\'import des contacts ?', 'Attention', ['Confirmer', 'Annuler']).then(
        function (choix) {
          // Choix -> Integer: 0 - no button, 1 - button 1, 2 - button 2
          if (choix === 1) {

            $rootScope.showImportingOverlay();

            var filenameToLoad = cordova.file.applicationDirectory.substring(0, 4) === "http" ? cordova.file.applicationDirectory + "file/licencies-asm-bad-2015.json" : cordova.file.applicationDirectory + "www/file/licencies-asm-bad-2015.json";

            $http.get(filenameToLoad)

              .success(function (licencies, status, headers, config) {
                ContactsManager.importAllContactsASM(licencies)
                  .then($scope.processAfterImport)
                  .then($scope.countContactAgain)
                  .catch($rootScope.alertAno);
              })
              .error(function (data, status, headers, config) {
                $rootScope.hideOverlay();
                alert("Impossible de lire le fichier " + cordova.file.applicationDirectory + "www/file/", "licencies-asm-bad-2015.json");
              });
          }
        })
    };

  })

  .controller('SmsCtrl', ['$rootScope', '$scope', 'ContactsManager', 'SmsManager', 'LocalStorageAPI', '$q', '$log', '$ionicModal', '$interval', function ($rootScope, $scope, ContactsManager, SmsManager, LocalStorageAPI,$q, $log, $ionicModal, $interval) {

    $scope.initFields = function () {
      $scope.form = {
        message: "",
        isBureau: false,
        isAdherent: false
      };
      $scope.SMS_THRESHOLD = 160;
      $scope.settings = {
        SmsSecurityOptionEnable: $rootScope.SmsSecurityOptionEnable
      };
    };

    $scope.initFields();

    $scope.isButtonDisabled = function () {
      //le bouton envoi SMS est disabled si :
      // -- pas de réseau
      // -- pas de contact
      // pas de destinataire et de message saisi par l'utilisateur
      if ($rootScope.contactsASM.length === 0 || !$rootScope.networkOnLine || $scope.form.message.length === 0 || (!$scope.form.isAdherent && !$scope.form.isBureau )) {
        return true;
      } else {
        return false;
      }
    };

    $scope.changeAdherentState = function () {
      $scope.form.isAdherent = !$scope.form.isBureau;
    };

    $scope.changeBureauState = function () {
      $scope.form.isBureau = !$scope.form.isAdherent;
    };

    $ionicModal.fromTemplateUrl('templates/tab-sms-modal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $rootScope.modal = modal;
    });

    $ionicModal.fromTemplateUrl('templates/parameter-modal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $rootScope.parameterModal = modal;
    });


    $scope.sendSMS = function () {

      if ($scope.form.isBureau) {

        //On affiche u message d'attente..
        $rootScope.showSendingSMSOverlay();

        ContactsManager.getAllBureauMemberASM()
          //pas besoin de découper l'envoi des mails pour le bureau !
          //la promesse est donc un tableau avec un seul élément
          .then(SmsManager.getUniquePhoneNumber)
          .then(function (phonesNumberBureau) {
            //envoi sans INTENT android
            SmsManager.sendSMSToContacts(phonesNumberBureau, $scope.form.message)
              .then(function (res) {
                //res est un tableau de string contenant la valeur "OK" si SMS envoyé
                $scope.initFields();
                $rootScope.hideOverlay();
                //renvoi du message pour la prochaine promise qui doit l'afficher sous la forme d'un Toast
                return $q.when(res.length + ' SMS ont été envoyés.');
              })
              .then($rootScope.displayToast)
              .catch($rootScope.alertAno);
          })
          .catch($rootScope.alertAno);

      } else {

          //si le téléphone supporte l'option Parametres > Securité > SMS alors on ne slide pas les contacts, on envoi directement tous les SMS !!!
          if ($rootScope.SmsSecurityOptionEnable) {

            ContactsManager.getAllContactASM()
              .then(SmsManager.getUniquePhoneNumber)
              .then(function (phonesNumberBureau) {
                //envoi sans INTENT android
                SmsManager.sendSMSToContacts(phonesNumberBureau, $scope.form.message)
                  .then(function (res) {
                    //res est un tableau de string contenant la valeur "OK" si SMS envoyé
                    $scope.initFields();
                    $rootScope.hideOverlay();
                    //renvoi du message pour la prochaine promise qui doit l'afficher sous la forme d'un Toast
                    return $q.when(res.length + ' SMS ont été envoyés.');
                  })
                  .then($rootScope.displayToast)
                  .catch($rootScope.alertAno);
              })
              .catch($rootScope.alertAno);

          } else {

            //On recherche tous les contacts
            //On affiche une modale avec les paquest de 10 ou 15 SMS qui vont être envoyés toutes les 30s
            //$scope.SMSSentTo = [["0781400940", "0781400940", "0781400940"], ["0781400940","0781400940","0781400940","0781400940","0781400940","0781400940"],["0781400940", "0781400940", "0781400940"]];
            //$scope.displayModal($scope.SMSSentTo);
            ContactsManager.getAllContactASM()
              .then(SmsManager.prepareSliceContact)
              .then(function (numbers) {
                $scope.displayModal(numbers);
              })
              .catch($rootScope.alertAno);
          }
      }

    };

    $scope.displayModal = function (phoneNumbersArray) {

      var numbers;
      $scope.countSMS = 0;
      $scope.SMSSentTo = phoneNumbersArray;
      $rootScope.showModal();

      /**
       * Envoi paquet SMS toutes les 30s
       */
      $interval(function () {
        numbers = $scope.SMSSentTo.shift();
        $scope.countSMS = $scope.countSMS + numbers.length;

        SmsManager.sendSMSToContacts(numbers, $scope.form.message)
          .then(function (res) {
            $log.info('envoi OK');
          });

        if ($scope.SMSSentTo.length === 0) {
          $scope.closeModal();
          $scope.initFields();
          $rootScope.displayToast($scope.countSMS + ' ont été envoyés !');
        }
      }, 30000, phoneNumbersArray.length);

    };

    $scope.saveSettings = function() {
      if (LocalStorageAPI.isLocalStorageAvailable) {
        LocalStorageAPI.saveSearchResult("SMSOptionSecurity", $scope.settings.SmsSecurityOptionEnable);
      }
      $rootScope.SmsSecurityOptionEnable =  $scope.settings.SmsSecurityOptionEnable;
    }

  }]);