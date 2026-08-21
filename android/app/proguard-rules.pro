# ProGuard rules for GAMERHUB Android (Capacitor)

# Keep Capacitor core
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugins.** { *; }
-keep class com.getcapacitor.plugin.** { *; }

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor ChromeClient
-keep class com.getcapacitor.Bridge { *; }
-keep class com.getcapacitor.BridgeActivity { *; }
-keep class com.getcapacitor.WebViewLocalServer { *; }

# Don't obfuscate Capacitor plugin annotations
-keepattributes *Annotation*

# Keep Room/Prisma related (if used via plugins)
-keep class android.arch.** { *; }

# General Android
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
