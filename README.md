# ANDROID-ASM-BAD
Application Android/Ionic à destination des membres du bureau ASM Badminton

changer la version fichier config.xml
cordova build --release android -- --ant
keytool -genkey -v -keystore asmbad-release-key.keystore -alias asmbad -keyalg RSA -keysize 2048 -validity 10000
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore asmbad-release-key.keystore platforms\android\bin\MainActivity-release-unsigned.apk asmbad

set path=c:\Developpement\android-sdk-windows\build-tools\22.0.1;%path%
zipalign -v 4 platforms\android\bin\MainActivity-release-unsigned.apk ASMBad.apk

# v1.1.2
- Correction bugs affichage et calcul des stats.
- Revision des mécanismes d'import/suppression
- Gestion whitelist
-- Content Security Policy (CSP) http://content-securitypolicy.com/
----https://github.com/apache/cordova-plugin-whitelist#content-securitypolicy

# v1.1.3
- Récupération de tous les mobiles d'un contact si plusieurs ont été enregistrés !
- Ajout du plugin $cordovaStatusbar 
- Modif gestion sélection/désélection checkbox envoi sms
- Correction bug : ajout Overlay lors de l'envoi des SMS aux adhérents
- Augmentation taille champ message SMS (255)
- Import local police Robotodraft

# v1.1.4 *
 bower install ion-md-input --save-dev
 bower install ionic-material --save-dev
 bower install robotodraft --save 
 
- Menu gauche : ajout avatar du club
- Intégration Material Design
- Détection orientation mobile

- Page envoi SMS : aligner les checkbox si landscape
- Intégration librairie ion-md-input


# V1.1.5
- Montée version ionic (ionic lib update)
- Charger les contacts depuis firebase
-- si modif, ajout, suppression
-- prévoir une notification et un nouveau bouton
- Ajouter une medai query pour cacher le footer du menu si hauteut trop juste
- Afficher le nombre de contacts avec mobile (06 et 07) dans les stats

