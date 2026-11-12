# Proguard rules for MediaDrop
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.room.* *;
}

# Keep OkHttp internals needed for chunked streaming
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# Keep Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
