angular.module('starter.services', [])

  .service('SmsManager', ['$cordovaSms', '$log', '$q', '$timeout', function ($cordovaSms, $log, $q, $timeout) {

    function optimizePhoneNumbers(contacts) {

      var phoneNumbers = [];

      //On parcourt une premiere fois la liste des contacts pour générer une liste des numéros de téléphones des contacts ASM
      angular.forEach(contacts, function (contact, index) {
          if (contact.phoneNumbers && contact.phoneNumbers !== null && contact.phoneNumbers !== "" && contact.phoneNumbers[0].type === "mobile") {
            telephoneNumber = contact.phoneNumbers[0].value.split(" ").join("");
            phoneNumbers.push(telephoneNumber);
          }
        }
      );

      //On élimine ensuite les éventuels doublons
      var phoneNumbersWithoutDuplicates = [];
      phoneNumbers.forEach(function (phoneNumber) {
        if (phoneNumbersWithoutDuplicates.indexOf(phoneNumber) < 0) {
          phoneNumbersWithoutDuplicates.push(phoneNumber);
        }
      });

      return phoneNumbersWithoutDuplicates;
    }

    this.getUniquePhoneNumber = function (contacts) {
      return $q.when(optimizePhoneNumbers(contacts));
    };

    this.prepareSliceContact = function (contacts) {

      var promises = [];

      var phoneNumbersWithoutDuplicates = optimizePhoneNumbers(contacts);

      //On slice le tableau de contacts par tranche de 15
      var startIndex = 0, step = 10, subArray;
      while (startIndex < phoneNumbersWithoutDuplicates.length) {
        subArray = phoneNumbersWithoutDuplicates.slice(startIndex, (startIndex + step));
        $log.info("startIndex (" + startIndex + "-" + (startIndex + step) + ") : " + subArray);
        startIndex = startIndex + step;
        promises.push(subArray);
      }

      return $q.when(promises);

    };

    /**
     * Envoi d'un SMS pour une tranche de contact (15 par défaut)
     * @param phoneNumbersWithoutDuplicates
     * @param message
     * @returns {promise résolue lors que le SMS a été envoyé}
     */

    this.sendSMSToContacts = function (phoneNumbersWithoutDuplicates, message) {

      // optionn d'envoi des SMS
      var optionsSMS = {
        replaceLineBreaks: false,
        android: {
          //intent: 'INTENT'  // send SMS with the native android SMS messaging
          intent: '' // send SMS without open any other app
        }
      };

      /** la commande $cordovaSms.send(phoneNumbersWithoutDuplicates, message, optionsSMS)
       *  ne marche pas avec un tableau de tél si android.intent ="" ; OK avec intent = "INTENT"
       *  Par contre si on itère sur la liste des tél, c'est OK
       */

      //return $cordovaSms.send(phoneNumbersWithoutDuplicates, message, optionsSMS);

      //On reparcourt la liste pour envoyer les SMS
      var promises = [];

      angular.forEach(phoneNumbersWithoutDuplicates, function (number, index) {
        $log.info("Envoi SMS aux numéros " + number);
        promises.push($cordovaSms.send(number, message, optionsSMS));
      });

      return $q.all(promises);
    }

  }])

  .service('ToastManager', ['$cordovaToast', '$q', function ($cordovaToast, $q) {

    this.displayToast = function (message) {
      $cordovaToast.showLongBottom(message);
      /**        .then(function (success) {
          // success
        }, function (error) {
          $q.reject(error);
        });*/
    };

  }])

  .service('ContactsTransformer', ['$log', function ($log) {

    this.transform = function (contact) {
      // contact.familyName et contact.givenName sont inversés pour que le gestionnaire de contact associe correctement la lettre de l'alphabet avec
      // le nom de la personne
      var newContact = {
        "name": {
          "familyName": contact.familyName,
          "formatted": contact.formatted,
          "givenName": contact.givenName
        },
        "displayName": contact.formatted,
        "nickname": contact.formatted,
        "note": contact.organizations + " - " + contact.note,
        "addresses": [{
          "streetAddress": contact.streetAddress,
          "postalCode": contact.postalCode,
          "locality": contact.locality,
          "country": contact.country,
          "type": "home"
        }],
        "categories": [{"value": "ASM Badminton", "type": "other"}]
      };

      //TODO tester les rubriques 'sex' et 'category' pour alimenter les champs et les stats
      /** ne fonctionne pas sous Android
       var parts;
       if (contact.birthday) {
        parts = contact.birthday.split('/');
        //please put attention to the month (parts[0]), Javascript counts months from 0:
        // January - 0, February - 1, etc
        newContact.birthday = new Date(Number(parts[2]), Number(parts[1])-1, Number(parts[0])+1,0,0,0,0);
      }*/
      /**
       * bithday format "2015-11-10"
       */
      if (contact.birthday) {
        parts = contact.birthday.split('/');
        //please put attention to the month (parts[0]), Javascript counts months from 0:
        // January - 0, February - 1, etc
        newContact.birthday = Number(parts[2])+"-"+Number(parts[1])+"-"+Number(parts[0]);
      }

      if (contact.emails.length > 0) {
        newContact.emails = [{"value": contact.emails, "type": "home"}];
      }

      if (contact.phoneNumbers.length > 0) {
        var indicatif = contact.phoneNumbers.substring(0, 2);
        newContact.phoneNumbers = [{
          "value": contact.phoneNumbers,
          "type": (indicatif === "06" || indicatif === "07") ? "mobile" : "home"
        }];
      }

      newContact.organizations = [{
        "name": (contact.member ? "ASM Badminton Bureau" : "ASM Badminton " + contact.category.toUpperCase()),
        "title": contact.organizations,
        "pref": true
      }];

      $log.info('Creation du contact ' + contact.formatted);

      return newContact;
    }
  }])

  .factory('ContactsManager', ['$log', '$q', 'ContactsTransformer', '$cordovaContacts', function ($log, $q, ContactsTransformer, $cordovaContacts) {

    function retrieveAllMembersASM() {
      var options = {};
      options.filter = "ASM Badminton Bureau";
      options.fields = ['organizations'];
      options.multiple = true;
      return retrieveAllContactsASM(options);
    };

    function retrieveAllContactsASM(searchOptions) {

      var deferred = $q.defer();

      var options = {};
      options.filter = searchOptions.filter || "ASM Badminton";
      options.fields = searchOptions.fields || ['organizations'];
      options.multiple = true;

      //get the phone contacts
      $cordovaContacts.find(options)
        .then(
        function (contacts) {
          deferred.resolve(contacts);
        },
        function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    function saveAContact(contactToSave) {
      var deferred = $q.defer();
      $cordovaContacts.save(contactToSave)
        .then(
        function (contact) {
          deferred.resolve(contact);
        },
        function (error) {
          deferred.reject(error);
        });
      return deferred.promise;

    };

    function saveAllContactsASM(contacts) {

      var promises = [];
      //ajout des licencies dans les contacts
      angular.forEach(contacts, function (contact, index) {

        var contactToSave = ContactsTransformer.transform(contact);
        //$cordovaContacts.save(contactToSave)
        promises.push(saveAContact(contactToSave));

      });

      return $q.all(promises);

    };

    function deleteContacts(contacts) {
      var promises = [];
      //var contactsRemoved = 0;
      angular.forEach(contacts, function (contact, index) {
        if (contact.organizations[0] &&
          (contact.organizations[0].name === "ASM Badminton" || contact.organizations[0].name === "ASM Badminton Bureau")) {
          promises.push(contact.remove())
        }
      });

      return $q.all(promises);

    };

    function deleteAllContactsASM() {
      //catch à faire par l'application appelante
      return retrieveAllContactsASM({})
        .then(deleteContacts);
    };

    return {

      /** promise : liste des membres du bureau ou [] si erreur*/
      getAllBureauMemberASM: function () {
        return retrieveAllMembersASM();
      },
      /** promise : liste de tous les contacts ASM ou [] si erreur*/
      getAllContactASM: function () {
        return retrieveAllContactsASM({});
      },
      /** promise : résolue une fois tous les contacts supprimés ; retourne le nombre de contact supprimé */
      removeAllContactsASM: function () {
        return deleteAllContactsASM();
      },
      importAllContactsASM: function (contacts) {
        return saveAllContactsASM(contacts);
      }

    };

  }])

  .service('LocalStorageAPI', [function () {

    this.isLocalStorageAvailable = function () {
      return (typeof(localStorage) !== "undefined");
    };

    this.saveSearchResult = function (keyword, searchResult) {
      return localStorage.setItem(keyword,
        JSON.stringify(searchResult));
    };

    this.isResultPresent = function (keyword) {
      return JSON.parse(localStorage.getItem(keyword));
    };
  }]);

