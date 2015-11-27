angular.module('starter.controllers', [])

  .controller('TabCtrl', ['ionicMaterialInk', function (ionicMaterialInk) {
    // Set Ink on tabs
    ionicMaterialInk.displayEffect();
  }])

  .controller('SyntheseCtrl', ['$scope', '$rootScope', function ($scope, $rootScope) {
  }])

  .controller('AdministrationCtrl', ['$rootScope', '$scope', '$cordovaDialogs', '$http', 'ContactsManager', 'LocalStorageAPI', 'StatFactory', '$q', 'ionicMaterialInk', function ($rootScope, $scope, $cordovaDialogs, $http, ContactsManager, LocalStorageAPI, StatFactory, $q, ionicMaterialInk) {

    $scope.settings = {
      enableContact: false
    };
    
    $scope.isDisabledImport = function () {
      return !($scope.settings.enableContact && $rootScope.countContactsASM === 0);
    };

    $scope.isDisabledDelete = function () {
      return !($scope.settings.enableContact && $rootScope.countContactsASM > 0)
    };

    $scope.processAfterRemove = function (contactsRemoved) {

      $scope.countContactAgain()
        .then(function () {
          //On recharge les stats
          StatFactory.clear();
          $rootScope.statsASM = LocalStorageAPI.isResultPresent("StatsASM");
          $rootScope.hideOverlay();
          $rootScope.displayToast(contactsRemoved.length + ' contacts ASM ont été supprimés.');
        });
    };

    $scope.removeContacts = function () {

      ionicMaterialInk.displayEffect();

      //On commence par demander la confirmation à l'utilisateur
      $cordovaDialogs.confirm('Confirmez-vous la suppression des contacts de l\'ASM ?', 'Attention', ['Confirmer', 'Annuler']).then(
        function (choix) {
          // Choix -> Integer: 0 - no button, 1 - button 1, 2 - button 2
          if (choix === 1) {

            $rootScope.showRemovingOverlay();
            //extraction des contacts ayant comme Organisation ASM Badminton
            ContactsManager.removeAllContactsASM()
              .then($scope.processAfterRemove)
              .catch($rootScope.alertAno);

          } //fin choix
        });

    };

    $scope.countContactAgain = function () {

      var deferred = $q.defer();

      //on recompte les adhérents, les membres puis les minibad
      ContactsManager.getAllContactASM()
        .then(
          function (contacts) {
            $rootScope.countContactsASM = contacts.length;
            return $q.when("");
          })
        .then(ContactsManager.getAllBureauMemberASM)
        .then(
          function (membersImported) {
            $rootScope.membersASM = membersImported;
            return $q.when("");
          })
        .then(ContactsManager.getAllMinibadMemberASM)
        .then(
          function (minibad) {
            $rootScope.countMinibadASM = minibad.length;
            deferred.resolve("");
          }
        );

      return deferred.promise;

    };

    $scope.processAfterImport = function (contactAdded) {
      $scope.countContactAgain()
        .then(function () {
          //On recharge les stats
          StatFactory.store();
          $rootScope.statsASM = LocalStorageAPI.isResultPresent("StatsASM");
          $rootScope.computeStats();
          $rootScope.hideOverlay();
          $rootScope.displayToast(contactAdded + ' contacts ASM ont été importés.');
        })
    };

    $scope.importContacts = function () {

      ionicMaterialInk.displayEffect();

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
                  .catch($rootScope.alertAno);
              })
              .error(function (data, status, headers, config) {
                $rootScope.hideOverlay();
                alert("Impossible de lire le fichier " + cordova.file.applicationDirectory + "www/file/", "licencies-asm-bad-2015.json");
              });
          }
        })
    };

    ionicMaterialInk.displayEffect();

  }])

  .controller('SmsCtrl', ['$rootScope', '$scope', 'ContactsManager', 'SmsManager', 'LocalStorageAPI', '$q', '$log', '$ionicModal', '$interval', '$cordovaDialogs', 'ionicMaterialInk',
    function ($rootScope, $scope, ContactsManager, SmsManager, LocalStorageAPI, $q, $log, $ionicModal, $interval, $cordovaDialogs, ionicMaterialInk) {

    $scope.initFields = function () {
      $scope.form = {
        message: "",
        isBureau: false,
        isAdherent: false,
        isMinibad: false
      };
      $scope.SMS_THRESHOLD = 255;
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
      if ($rootScope.countContactsASM === 0 || !$rootScope.networkOnLine || $scope.form.message.length === 0 || (!$scope.form.isAdherent && !$scope.form.isBureau && !$scope.form.isMinibad)) {
        return true;
      } else {
        return false;
      }
    };

    $scope.changeAdherentStateIfIsMinibad = function () {
      if ($scope.form.isMinibad) {
        $scope.form.isAdherent = false;
        $scope.form.isBureau = false;
      }
    };

    $scope.changeAdherentStateIfIsMember = function () {
      if ($scope.form.isBureau) {
        $scope.form.isAdherent = false;
        $scope.form.isMinibad = false;
      }
    };

    $scope.changeBureauState = function () {
      if ($scope.form.isAdherent) {
        $scope.form.isBureau = false;
        $scope.form.isMinibad = false;
      }
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

      //On commence par demander la confirmation à l'utilisateur
      $cordovaDialogs.confirm('Confirmez-vous l\'envoi du SMS ?', 'ATTENTION', ['Confirmer', 'Annuler']).then(
        function (choix) {
          // Choix -> Integer: 0 - no button, 1 - button 1, 2 - button 2
          if (choix === 1) {

            if ($scope.form.isBureau || $scope.form.isMinibad) {

              var type = $scope.form.isBureau ? "Bureau" : "Minibad";

              //On affiche un message d'attente..
              $rootScope.showSendingSMSOverlay();

              ContactsManager.getContactsByType(type)
                //pas besoin de découper l'envoi des mails pour le bureau ou le minibad  !
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

                //On affiche un message d'attente..
                $rootScope.showSendingSMSOverlay();

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
          }
        }
      )
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
      }, 60000, phoneNumbersArray.length);

    };

    $scope.saveSettings = function () {
      if (LocalStorageAPI.isLocalStorageAvailable) {
        LocalStorageAPI.saveSearchResult("SMSOptionSecurity", $scope.settings.SmsSecurityOptionEnable);
      }
      $rootScope.SmsSecurityOptionEnable = $scope.settings.SmsSecurityOptionEnable;
    }

    // Set Ink
    ionicMaterialInk.displayEffect();
  }
  ])
;
