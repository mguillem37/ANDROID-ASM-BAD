# ANDROID-ASM-BAD
Application Android/Ionic à destination des membres du bureau ASM Badminton

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
- Affichage barre d'état couleur positive 
- Material Design
- Montée version ionic (ionic lilb update)
- install gulp

