# ANDROID-ASM-BAD
Application Android/Ionic à destination des membres du bureau ASM Badminton

cordova build --release android -- --ant
keytool -genkey -v -keystore asmbad-release-key.keystore -alias asmbad -keyalg RSA -keysize 2048 -validity 10000
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore asmbad-release-key.keystore platforms\android\bin\MainActivity-release-unsigned.apk asmbad
