import { AndroidProjectFile } from '../types';

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: '.github/workflows/build-signed-apk.yml',
    category: 'ci',
    description: 'GitHub Actions workflow to automatically build Debug APK and signed Release APK',
    content: `name: Build Android APK (Debug & Release)

on:
  push:
    branches: [ main, master ]
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-apk:
    name: Build Android APK (Debug & Release)
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.11.1'

      # Step 1: Build Debug APK (No keystore needed - ready to install on Android immediately)
      - name: Build Debug APK
        run: |
          gradle assembleDebug --no-daemon --stacktrace

      - name: Verify Debug APK Output
        run: |
          ls -la app/build/outputs/apk/debug/ || true

      - name: Upload Debug APK Artifact (Installable on any Android phone)
        uses: actions/upload-artifact@v4
        with:
          name: MediaDrop-Debug-APK
          path: app/build/outputs/apk/debug/*.apk
          retention-days: 30

      # Step 2: Build Signed Release APK
      - name: Decode Keystore from Secrets (Optional)
        env:
          KEYSTORE_BASE64: \${{ secrets.RELEASE_KEYSTORE_BASE64 }}
        run: |
          if [ -n "$KEYSTORE_BASE64" ]; then
            echo "Decoding custom release keystore..."
            mkdir -p app/keystore
            echo "$KEYSTORE_BASE64" | base64 --decode > app/keystore/release.jks
          else
            echo "No custom keystore secret provided. Release will use debug signature fallback."
          fi

      - name: Build Release APK
        env:
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: \${{ secrets.KEY_PASSWORD }}
        run: |
          if [ -f "app/keystore/release.jks" ]; then
            export SIGNING_KEYSTORE_PATH="keystore/release.jks"
          fi
          gradle assembleRelease --no-daemon --stacktrace

      - name: Verify Release APK Output
        run: |
          ls -la app/build/outputs/apk/release/ || true

      - name: Upload Signed Release APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: MediaDrop-Release-APK
          path: app/build/outputs/apk/release/*.apk
          retention-days: 30

      - name: Create GitHub Release (on tag)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: |
            app/build/outputs/apk/debug/*.apk
            app/build/outputs/apk/release/*.apk
          generate_release_notes: true
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'xml',
    description: 'Manifest declaring ACTION_SEND intent-filter for shared media links and foreground service',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions required for network downloading -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Android 13+ Notification permission -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Foreground Service permissions for background downloads -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="MediaDrop"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@android:style/Theme.Material.Light.NoActionBar"
            android:windowSoftInputMode="adjustResize">

            <!-- Default launcher entry point -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Intercept shared links from any app (Chrome, Twitter, Reddit, etc.) -->
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>

            <!-- Direct URL click interception for media files -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="http" />
                <data android:scheme="https" />
                <data android:pathPattern=".*\\\\.mp4" />
                <data android:pathPattern=".*\\\\.mp3" />
                <data android:pathPattern=".*\\\\.m4a" />
                <data android:pathPattern=".*\\\\.jpg" />
                <data android:pathPattern=".*\\\\.png" />
                <data android:pathPattern=".*\\\\.webp" />
            </intent-filter>
        </activity>

        <!-- Foreground service for reliable background downloads with progress notifications -->
        <service
            android:name=".service.DownloadForegroundService"
            android:foregroundServiceType="dataSync"
            android:exported="false" />

    </application>

</manifest>
`,
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    category: 'xml',
    description: 'Android application strings resource',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">MediaDrop</string>
</resources>
`,
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    category: 'xml',
    description: 'Android application themes resource',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.MediaDrop" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
    </style>
</resources>
`,
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    category: 'xml',
    description: 'Android application color palette',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#6366F1</color>
    <color name="primary_dark">#4F46E5</color>
    <color name="secondary">#14B8A6</color>
    <color name="background">#0F172A</color>
    <color name="surface">#1E293B</color>
</resources>
`,
  },
  {
    path: 'app/src/main/res/mipmap/ic_launcher.xml',
    category: 'xml',
    description: 'Base Android launcher icon for AAPT2 fallback',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`,
  },
  {
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    category: 'xml',
    description: 'Android adaptive launcher icon',
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_background.xml',
    category: 'xml',
    description: 'Android launcher icon background vector drawable',
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#4F46E5"
        android:pathData="M0,0h108v108h-108z"/>
</vector>
`,
  },
  {
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    category: 'xml',
    description: 'Android launcher icon foreground vector drawable',
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#00000000"
        android:pathData="M54,28 L54,64 M40,50 L54,64 L68,50 M32,76 L76,76"
        android:strokeWidth="6"
        android:strokeColor="#FFFFFF"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"/>
</vector>
`,
  },
  {
    path: 'app/src/main/kotlin/com/mediadrop/app/MainActivity.kt',
    category: 'kotlin',
    description: 'ComponentActivity handling incoming Intent.ACTION_SEND and Compose root navigation',
    content: `package com.mediadrop.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.app.ActivityCompat
import com.mediadrop.app.ui.screens.DownloadScreen
import com.mediadrop.app.ui.screens.HistoryScreen
import com.mediadrop.app.ui.screens.SettingsScreen
import com.mediadrop.app.ui.theme.MediaDropTheme

class MainActivity : ComponentActivity() {

    private val sharedUrlState = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Handle incoming intent if app was opened via share sheet or direct link
        handleIncomingIntent(intent)

        // Request notification permission on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
                101
            )
        }

        setContent {
            MediaDropTheme {
                MainAppScreen(
                    initialSharedUrl = sharedUrlState.value,
                    onClearSharedUrl = { sharedUrlState.value = null }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        if (intent == null) return

        when (intent.action) {
            Intent.ACTION_SEND -> {
                if (intent.type == "text/plain") {
                    val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                    if (!sharedText.isNullOrBlank()) {
                        val extractedUrl = extractUrl(sharedText)
                        sharedUrlState.value = extractedUrl ?: sharedText.trim()
                    }
                }
            }
            Intent.ACTION_VIEW -> {
                intent.dataString?.let { url ->
                    sharedUrlState.value = url
                }
            }
        }
    }

    private fun extractUrl(text: String): String? {
        val urlRegex = Regex("""https?://[^\\s<>"'{}|\\\\^\`]+""")
        return urlRegex.find(text)?.value
    }
}

@Composable
fun MainAppScreen(
    initialSharedUrl: String?,
    onClearSharedUrl: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }

    LaunchedEffect(initialSharedUrl) {
        if (!initialSharedUrl.isNullOrBlank()) {
            selectedTab = 0
        }
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Download, contentDescription = "Download") },
                    label = { Text("Download") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.History, contentDescription = "History") },
                    label = { Text("History") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") }
                )
            }
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            color = MaterialTheme.colorScheme.background
        ) {
            when (selectedTab) {
                0 -> DownloadScreen(
                    sharedUrl = initialSharedUrl,
                    onSharedUrlHandled = onClearSharedUrl
                )
                1 -> HistoryScreen()
                2 -> SettingsScreen()
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/kotlin/com/mediadrop/app/downloader/OkHttpDownloader.kt',
    category: 'kotlin',
    description: 'OkHttp bridge for NewPipeExtractor to perform network requests on Android',
    content: `package com.mediadrop.app.downloader

import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import org.schabi.newpipe.extractor.downloader.Downloader
import org.schabi.newpipe.extractor.downloader.Request
import org.schabi.newpipe.extractor.downloader.Response
import java.util.concurrent.ConcurrentHashMap

class OkHttpDownloader(private val client: OkHttpClient) : Downloader() {

    override fun execute(request: Request): Response {
        val httpMethod = request.httpMethod()
        val url = request.url()
        val headers = request.headers()
        val dataToSend = request.dataToSend()

        val body = when {
            httpMethod.equals("GET", ignoreCase = true) || httpMethod.equals("HEAD", ignoreCase = true) -> null
            dataToSend != null -> dataToSend.toRequestBody()
            httpMethod.equals("POST", ignoreCase = true) || httpMethod.equals("PUT", ignoreCase = true) -> ByteArray(0).toRequestBody()
            else -> null
        }
        val builder = okhttp3.Request.Builder().url(url)

        headers?.forEach { (key, values) ->
            values?.forEach { value ->
                builder.addHeader(key, value)
            }
        }

        builder.method(httpMethod, body)

        return client.newCall(builder.build()).execute().use { res ->
            val responseBody = res.body?.string() ?: ""
            val responseHeaders = ConcurrentHashMap<String, List<String>>()
            res.headers.toMultimap().forEach { (k, v) ->
                responseHeaders[k] = v
            }

            Response(res.code, res.message, responseHeaders, responseBody, res.request.url.toString())
        }
    }
}
`,
  },
  {
    path: 'app/src/main/kotlin/com/mediadrop/app/downloader/HttpDownloader.kt',
    category: 'kotlin',
    description: 'NewPipeExtractor YouTube stream resolution & OkHttp chunked SAF downloader',
    content: `package com.mediadrop.app.downloader

import android.content.Context
import android.net.Uri
import androidx.documentfile.provider.DocumentFile
import com.mediadrop.app.data.MediaType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.stream.StreamInfo
import java.io.InputStream
import java.io.OutputStream
import java.net.URLDecoder
import java.util.concurrent.TimeUnit

data class ProbeResult(
    val fileName: String,
    val mimeType: String,
    val mediaType: MediaType,
    val contentLength: Long,
    val directStreamUrl: String? = null,
    val isYouTube: Boolean = false
)

class HttpDownloader(private val context: Context) {

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    companion object {
        private var isNewPipeInitialized = false
    }

    init {
        synchronized(HttpDownloader::class.java) {
            if (!isNewPipeInitialized) {
                try {
                    NewPipe.init(OkHttpDownloader(client))
                    isNewPipeInitialized = true
                } catch (_: Exception) {}
            }
        }
    }

    suspend fun probeUrl(url: String): ProbeResult = withContext(Dispatchers.IO) {
        val trimmed = url.trim()
        val isYt = isYouTubeUrl(trimmed)

        if (isYt) {
            try {
                val streamInfo = StreamInfo.getInfo(ServiceList.YouTube, trimmed)
                val rawTitle = streamInfo.name ?: "youtube_video"
                val cleanTitle = rawTitle.replace(Regex("[/\\\\?%*:|\"<>]"), "_").trim()
                    .ifBlank { "youtube_video" }

                // Extract best progressive MP4 stream (muxed video + audio)
                val usableVideoStreams = streamInfo.videoStreams.filter {
                    it.isUrl && !it.content.isNullOrBlank()
                }
                val bestVideoStream = usableVideoStreams
                    .filter { it.format?.name.equals("MP4", ignoreCase = true) }
                    .maxByOrNull { it.height }
                    ?: usableVideoStreams.maxByOrNull { it.height }

                if (bestVideoStream != null) {
                    val fileName = if (cleanTitle.endsWith(".mp4", ignoreCase = true)) cleanTitle else "\${cleanTitle}.mp4"
                    val contentLength = bestVideoStream.itagItem?.contentLength?.takeIf { it > 0L } ?: -1L
                    return@withContext ProbeResult(
                        fileName = fileName,
                        mimeType = "video/mp4",
                        mediaType = MediaType.VIDEO_MP4,
                        contentLength = contentLength,
                        directStreamUrl = bestVideoStream.content,
                        isYouTube = true
                    )
                }

                // Fallback to best direct audio stream if no progressive muxed video stream is available
                val bestAudioStream = streamInfo.audioStreams
                    .filter { it.isUrl && !it.content.isNullOrBlank() }
                    .maxByOrNull { it.averageBitrate }

                if (bestAudioStream != null) {
                    val fileName = if (cleanTitle.endsWith(".m4a", ignoreCase = true)) cleanTitle else "\${cleanTitle}.m4a"
                    val contentLength = bestAudioStream.itagItem?.contentLength?.takeIf { it > 0L } ?: -1L
                    return@withContext ProbeResult(
                        fileName = fileName,
                        mimeType = "audio/mp4",
                        mediaType = MediaType.AUDIO_MP3,
                        contentLength = contentLength,
                        directStreamUrl = bestAudioStream.content,
                        isYouTube = true
                    )
                }

                throw IllegalStateException("No downloadable progressive streams found for this video")
            } catch (e: Exception) {
                throw IllegalStateException("YouTube extraction failed: \${e.message ?: "Unknown error"}", e)
            }
        }

        // Standard direct media URL inspection
        val request = Request.Builder()
            .url(trimmed)
            .head()
            .header("User-Agent", "Mozilla/5.0 (Android; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0")
            .build()

        var fileName = deriveFilename(trimmed)
        var mimeType = "application/octet-stream"
        var contentLength = -1L

        try {
            client.newCall(request).execute().use { response ->
                contentLength = response.header("Content-Length")?.toLongOrNull() ?: -1L
                mimeType = response.header("Content-Type")?.split(";")?.firstOrNull()?.trim() ?: mimeType

                response.header("Content-Disposition")?.let { cd ->
                    val nameMatch = Regex("""filename\\*?=['"]?(?:UTF-8'')?([^'";]+)['"]?""", RegexOption.IGNORE_CASE).find(cd)
                    nameMatch?.groupValues?.get(1)?.let { cdName ->
                        fileName = URLDecoder.decode(cdName, "UTF-8")
                    }
                }
            }
        } catch (_: Exception) {}

        val mediaType = categorizeMediaType(mimeType, fileName)
        ProbeResult(
            fileName = fileName,
            mimeType = mimeType,
            mediaType = mediaType,
            contentLength = contentLength,
            directStreamUrl = trimmed,
            isYouTube = false
        )
    }

    suspend fun downloadToFile(
        url: String,
        targetDirUri: Uri,
        fileName: String,
        mimeType: String,
        onProgress: (bytesRead: Long, totalBytes: Long, speedBps: Long) -> Unit,
        isCancelled: () -> Boolean
    ): Uri = withContext(Dispatchers.IO) {
        val dir = DocumentFile.fromTreeUri(context, targetDirUri)
            ?: throw IllegalStateException("Cannot access destination directory")

        // Create target file inside user's selected SAF folder
        val targetDoc = dir.createFile(mimeType, fileName)
            ?: throw IllegalStateException("Failed to create file in selected folder")

        val request = Request.Builder()
            .url(url)
            .header("User-Agent", "Mozilla/5.0 (Android; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0")
            .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            targetDoc.delete()
            throw IllegalStateException("HTTP Error: \${response.code} \${response.message}")
        }

        val body = response.body ?: throw IllegalStateException("Empty HTTP response body")
        val totalBytes = body.contentLength()

        var inputStream: InputStream? = null
        var outputStream: OutputStream? = null

        try {
            inputStream = body.byteStream()
            outputStream = context.contentResolver.openOutputStream(targetDoc.uri)
                ?: throw IllegalStateException("Cannot open output stream for document")

            val buffer = ByteArray(32 * 1024) // 32KB buffer for fast downloading
            var bytesCopied = 0L
            var lastTime = System.currentTimeMillis()
            var bytesSinceLastCheck = 0L
            var currentSpeed = 0L

            while (coroutineContext.isActive && !isCancelled()) {
                val read = inputStream.read(buffer)
                if (read == -1) break
                outputStream.write(buffer, 0, read)
                bytesCopied += read
                bytesSinceLastCheck += read

                val now = System.currentTimeMillis()
                val delta = now - lastTime
                if (delta >= 500) {
                    currentSpeed = (bytesSinceLastCheck * 1000) / delta
                    lastTime = now
                    bytesSinceLastCheck = 0L
                    onProgress(bytesCopied, totalBytes, currentSpeed)
                }
            }

            if (isCancelled()) {
                targetDoc.delete()
                throw IllegalStateException("Download was cancelled by user")
            }

            outputStream.flush()
            onProgress(bytesCopied, totalBytes, 0L)
            targetDoc.uri
        } catch (e: Exception) {
            targetDoc.delete()
            throw e
        } finally {
            inputStream?.close()
            outputStream?.close()
            response.close()
        }
    }

    private fun isYouTubeUrl(url: String): Boolean {
        val lower = url.lowercase()
        return lower.contains("youtube.com") || lower.contains("youtu.be")
    }

    private fun deriveFilename(url: String): String {
        return try {
            val uri = Uri.parse(url)
            val host = uri.host?.lowercase() ?: ""

            if (host.contains("youtube.com") || host.contains("youtu.be")) {
                val videoId = uri.getQueryParameter("v") ?: uri.lastPathSegment ?: "video"
                return "youtube_video_\${videoId}.mp4"
            }

            val lastPath = uri.lastPathSegment
            if (!lastPath.isNullOrBlank() && lastPath.contains(".")) {
                URLDecoder.decode(lastPath, "UTF-8")
            } else if (!lastPath.isNullOrBlank() && lastPath != "watch") {
                URLDecoder.decode(lastPath, "UTF-8") + ".mp4"
            } else {
                "media_\${System.currentTimeMillis()}.mp4"
            }
        } catch (_: Exception) {
            "media_\${System.currentTimeMillis()}.mp4"
        }
    }

    private fun categorizeMediaType(mimeType: String, fileName: String): MediaType {
        val lowerMime = mimeType.lowercase()
        val lowerName = fileName.lowercase()

        return when {
            lowerMime.startsWith("video/") || lowerName.endsWith(".mp4") || lowerName.endsWith(".mkv") || lowerName.endsWith(".webm") -> MediaType.VIDEO_MP4
            lowerMime.startsWith("audio/") || lowerName.endsWith(".mp3") || lowerName.endsWith(".m4a") || lowerName.endsWith(".aac") || lowerName.endsWith(".wav") || lowerName.endsWith(".ogg") -> MediaType.AUDIO_MP3
            lowerMime.startsWith("image/") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png") || lowerName.endsWith(".webp") || lowerName.endsWith(".gif") -> MediaType.IMAGE
            else -> MediaType.GENERIC
        }
    }
}
`,
  },
  {
    path: 'app/src/main/kotlin/com/mediadrop/app/ui/screens/DownloadScreen.kt',
    category: 'kotlin',
    description: 'Jetpack Compose download screen with SAF folder selector and live progress card',
    content: `package com.mediadrop.app.ui.screens

import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.mediadrop.app.data.DownloadStatus
import com.mediadrop.app.data.MediaType
import com.mediadrop.app.data.PreferencesManager
import com.mediadrop.app.downloader.HttpDownloader
import com.mediadrop.app.downloader.ProbeResult
import com.mediadrop.app.service.DownloadForegroundService
import kotlinx.coroutines.launch

@Composable
fun DownloadScreen(
    sharedUrl: String?,
    onSharedUrlHandled: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val preferencesManager = remember { PreferencesManager(context) }
    val downloader = remember { HttpDownloader(context) }

    var urlInput by remember { mutableStateOf("") }
    var isProbing by remember { mutableStateOf(false) }
    var probeResult by remember { mutableStateOf<ProbeResult?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val chosenFolderUri by preferencesManager.chosenFolderUri.collectAsState(initial = null)
    val chosenFolderName by preferencesManager.chosenFolderName.collectAsState(initial = "Select Destination Folder")

    var downloadProgress by remember { mutableFloatStateOf(0f) }
    var downloadSpeed by remember { mutableLongStateOf(0L) }
    var downloadedBytes by remember { mutableLongStateOf(0L) }
    var totalBytes by remember { mutableLongStateOf(0L) }
    var downloadStatus by remember { mutableStateOf(DownloadStatus.IDLE) }
    var isCancelled by remember { mutableStateOf(false) }

    val folderPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocumentTree()
    ) { uri: Uri? ->
        if (uri != null) {
            val takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            try {
                context.contentResolver.takePersistableUriPermission(uri, takeFlags)
            } catch (_: SecurityException) {}

            val folderName = uri.lastPathSegment ?: "Chosen Folder"
            scope.launch {
                preferencesManager.saveChosenFolder(uri, folderName)
            }
        }
    }

    LaunchedEffect(sharedUrl) {
        if (!sharedUrl.isNullOrBlank()) {
            urlInput = sharedUrl
            isProbing = true
            errorMessage = null
            try {
                probeResult = downloader.probeUrl(sharedUrl)
            } catch (e: Exception) {
                errorMessage = "Probe failed: \${e.message}"
            } finally {
                isProbing = false
                onSharedUrlHandled()
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Column {
            Text(
                text = "MediaDrop",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Fast MP4/MP3/Image Downloader",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // URL Input Card
        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Media URL",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                OutlinedTextField(
                    value = urlInput,
                    onValueChange = {
                        urlInput = it
                        probeResult = null
                    },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("https://example.com/video.mp4") },
                    singleLine = false,
                    maxLines = 3,
                    trailingIcon = {
                        if (urlInput.isNotEmpty()) {
                            IconButton(onClick = {
                                urlInput = ""
                                probeResult = null
                            }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear")
                            }
                        } else {
                            IconButton(onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                if (clipboard.hasPrimaryClip() && clipboard.primaryClipDescription?.hasMimeType(ClipDescription.MIMETYPE_TEXT_PLAIN) == true) {
                                    val item = clipboard.primaryClip?.getItemAt(0)
                                    val text = item?.text?.toString() ?: ""
                                    if (text.startsWith("http")) {
                                        urlInput = text
                                    }
                                }
                            }) {
                                Icon(Icons.Default.ContentPaste, contentDescription = "Paste")
                            }
                        }
                    }
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(
                        onClick = {
                            urlInput = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                        }
                    ) {
                        Text("Use MP4 Sample")
                    }

                    Button(
                        onClick = {
                            if (urlInput.isNotBlank()) {
                                scope.launch {
                                    isProbing = true
                                    errorMessage = null
                                    try {
                                        probeResult = downloader.probeUrl(urlInput.trim())
                                    } catch (e: Exception) {
                                        errorMessage = "Failed to inspect URL: \${e.message}"
                                    } finally {
                                        isProbing = false
                                    }
                                }
                            }
                        },
                        enabled = urlInput.isNotBlank() && !isProbing
                    ) {
                        if (isProbing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(Modifier.width(8.dp))
                            Text("Checking...")
                        } else {
                            Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Inspect Link")
                        }
                    }
                }
            }
        }

        // Destination Folder Card (Storage Access Framework)
        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Download Destination",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "Files are written directly into your selected Android folder via Storage Access Framework.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { folderPickerLauncher.launch(null) }
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(
                            Icons.Default.Folder,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(28.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = chosenFolderName,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = if (chosenFolderUri != null) "Folder Selected (Permanent Access)" else "Tap to choose folder",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Icon(Icons.Default.ChevronRight, contentDescription = null)
                    }
                }
            }
        }

        // Probed Media Information & Download Trigger
        AnimatedVisibility(visible = probeResult != null) {
            probeResult?.let { result ->
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.elevatedCardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            val icon = when (result.mediaType) {
                                MediaType.VIDEO_MP4 -> Icons.Default.Movie
                                MediaType.AUDIO_MP3 -> Icons.Default.Audiotrack
                                MediaType.IMAGE -> Icons.Default.Image
                                else -> Icons.Default.InsertDriveFile
                            }
                            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text(
                                text = result.fileName,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Column {
                                Text("Type", style = MaterialTheme.typography.bodySmall)
                                Text(result.mimeType, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                            }
                            Column {
                                Text("Size", style = MaterialTheme.typography.bodySmall)
                                Text(
                                    if (result.contentLength > 0) formatBytes(result.contentLength) else "Stream / Unknown",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        // Download Action Button
                        Button(
                            onClick = {
                                if (chosenFolderUri == null) {
                                    folderPickerLauncher.launch(null)
                                } else {
                                    downloadStatus = DownloadStatus.DOWNLOADING
                                    isCancelled = false
                                    downloadProgress = 0f

                                    val targetDownloadUrl = result.directStreamUrl ?: urlInput.trim()

                                    // Start Foreground Service for reliable background download
                                    val serviceIntent = Intent(context, DownloadForegroundService::class.java).apply {
                                        action = DownloadForegroundService.ACTION_START
                                        putExtra(DownloadForegroundService.EXTRA_URL, targetDownloadUrl)
                                        putExtra(DownloadForegroundService.EXTRA_TARGET_DIR, chosenFolderUri)
                                        putExtra(DownloadForegroundService.EXTRA_FILE_NAME, result.fileName)
                                        putExtra(DownloadForegroundService.EXTRA_MIME_TYPE, result.mimeType)
                                    }
                                    context.startForegroundService(serviceIntent)

                                    // In-app progress observation
                                    scope.launch {
                                        try {
                                            downloader.downloadToFile(
                                                url = targetDownloadUrl,
                                                targetDirUri = Uri.parse(chosenFolderUri),
                                                fileName = result.fileName,
                                                mimeType = result.mimeType,
                                                onProgress = { read, total, speed ->
                                                    downloadedBytes = read
                                                    totalBytes = total
                                                    downloadSpeed = speed
                                                    if (total > 0) {
                                                        downloadProgress = (read.toFloat() / total.toFloat()).coerceIn(0f, 1f)
                                                    }
                                                },
                                                isCancelled = { isCancelled }
                                            )
                                            downloadStatus = DownloadStatus.COMPLETED
                                        } catch (e: Exception) {
                                            if (isCancelled) {
                                                downloadStatus = DownloadStatus.CANCELLED
                                            } else {
                                                downloadStatus = DownloadStatus.FAILED
                                                errorMessage = e.message
                                            }
                                        }
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = downloadStatus != DownloadStatus.DOWNLOADING
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text(if (chosenFolderUri == null) "Select Folder & Download" else "Start Download")
                        }
                    }
                }
            }
        }

        // Live Download Progress Box
        AnimatedVisibility(visible = downloadStatus == DownloadStatus.DOWNLOADING || downloadStatus == DownloadStatus.COMPLETED) {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (downloadStatus == DownloadStatus.COMPLETED) "Download Complete!" else "Downloading...",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (downloadStatus == DownloadStatus.COMPLETED) "100%" else "\${(downloadProgress * 100).toInt()}%",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    LinearProgressIndicator(
                        progress = { if (downloadStatus == DownloadStatus.COMPLETED) 1f else downloadProgress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "\${formatBytes(downloadedBytes)} / \${if (totalBytes > 0) formatBytes(totalBytes) else \"...\"}",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                            text = if (downloadSpeed > 0) formatSpeed(downloadSpeed) else "",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    if (downloadStatus == DownloadStatus.DOWNLOADING) {
                        OutlinedButton(
                            onClick = {
                                isCancelled = true
                                downloadStatus = DownloadStatus.CANCELLED
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Close, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Cancel Download")
                        }
                    }
                }
            }
        }

        // Error Banner
        AnimatedVisibility(visible = errorMessage != null) {
            errorMessage?.let { error ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.errorContainer
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                        Text(
                            text = error,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
        }
    }
}

private fun formatBytes(bytes: Long): String {
    return when {
        bytes >= 1024 * 1024 * 1024 -> String.format("%.2f GB", bytes / (1024.0 * 1024.0 * 1024.0))
        bytes >= 1024 * 1024 -> String.format("%.1f MB", bytes / (1024.0 * 1024.0))
        bytes >= 1024 -> String.format("%.0f KB", bytes / 1024.0)
        else -> "\$bytes B"
    }
}

private fun formatSpeed(bytesPerSec: Long): String {
    return when {
        bytesPerSec >= 1024 * 1024 -> String.format("%.1f MB/s", bytesPerSec / (1024.0 * 1024.0))
        bytesPerSec >= 1024 -> String.format("%.0f KB/s", bytesPerSec / 1024.0)
        else -> "\$bytesPerSec B/s"
    }
}
`,
  },
  {
    path: 'app/src/main/kotlin/com/mediadrop/app/service/DownloadForegroundService.kt',
    category: 'kotlin',
    description: 'Foreground Service running downloads with notification shade progress',
    content: `package com.mediadrop.app.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.mediadrop.app.MainActivity
import com.mediadrop.app.downloader.HttpDownloader
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class DownloadForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + Job())
    private lateinit var downloader: HttpDownloader
    private lateinit var notificationManager: NotificationManager
    private var downloadJob: Job? = null
    private var isCancelled = false

    companion object {
        const val CHANNEL_ID = "media_drop_download_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "ACTION_START_DOWNLOAD"
        const val ACTION_CANCEL = "ACTION_CANCEL_DOWNLOAD"

        const val EXTRA_URL = "extra_download_url"
        const val EXTRA_TARGET_DIR = "extra_target_dir_uri"
        const val EXTRA_FILE_NAME = "extra_file_name"
        const val EXTRA_MIME_TYPE = "extra_mime_type"
    }

    override fun onCreate() {
        super.onCreate()
        downloader = HttpDownloader(this)
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val url = intent.getStringExtra(EXTRA_URL) ?: return START_NOT_STICKY
                val targetDirString = intent.getStringExtra(EXTRA_TARGET_DIR) ?: return START_NOT_STICKY
                val fileName = intent.getStringExtra(EXTRA_FILE_NAME) ?: "download"
                val mimeType = intent.getStringExtra(EXTRA_MIME_TYPE) ?: "application/octet-stream"

                startForeground(NOTIFICATION_ID, buildProgressNotification(fileName, 0, 100, 0L))
                isCancelled = false

                downloadJob = serviceScope.launch {
                    try {
                        val targetDirUri = Uri.parse(targetDirString)
                        downloader.downloadToFile(
                            url = url,
                            targetDirUri = targetDirUri,
                            fileName = fileName,
                            mimeType = mimeType,
                            onProgress = { bytesRead, totalBytes, speedBps ->
                                val progress = if (totalBytes > 0) ((bytesRead * 100) / totalBytes).toInt() else 0
                                notificationManager.notify(
                                    NOTIFICATION_ID,
                                    buildProgressNotification(fileName, progress, 100, speedBps)
                                )
                            },
                            isCancelled = { isCancelled }
                        )
                    } catch (e: Exception) {
                        // Error handling
                    } finally {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            stopForeground(Service.STOP_FOREGROUND_DETACH)
                        } else {
                            @Suppress("DEPRECATION")
                            stopForeground(false)
                        }
                        stopSelf()
                    }
                }
            }
            ACTION_CANCEL -> {
                isCancelled = true
                downloadJob?.cancel()
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(Service.STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Media Downloads",
                NotificationManager.IMPORTANCE_LOW
            )
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildProgressNotification(fileName: String, progress: Int, max: Int, speedBps: Long): android.app.Notification {
        val openAppIntent = Intent(this, MainActivity::class.java)
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Downloading: $fileName")
            .setContentText("$progress%")
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setProgress(max, progress, max == 0)
            .setOngoing(true)
            .setContentIntent(openPendingIntent)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`,
  },
  {
    path: 'app/build.gradle.kts',
    category: 'gradle',
    description: 'App module build script with automated signing configuration and dependencies',
    content: `import java.io.File

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.mediadrop.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.mediadrop.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        val keystorePath = System.getenv("SIGNING_KEYSTORE_PATH")
        if (!keystorePath.isNullOrEmpty() && File(keystorePath).exists()) {
            create("release") {
                storeFile = File(keystorePath)
                storePassword = System.getenv("KEYSTORE_PASSWORD") ?: ""
                keyAlias = System.getenv("KEY_ALIAS") ?: ""
                keyPassword = System.getenv("KEY_PASSWORD") ?: ""
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            val releaseConfig = signingConfigs.findByName("release")
            signingConfig = releaseConfig ?: signingConfigs.getByName("debug")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "META-INF/DEPENDENCIES"
            excludes += "META-INF/LICENSE*"
            excludes += "META-INF/NOTICE*"
            excludes += "META-INF/INDEX.LIST"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)

    // Networking for direct media download & chunked streaming
    implementation(libs.okhttp)

    // Storage Access Framework (SAF) folder picker support
    implementation(libs.androidx.documentfile)

    // DataStore Preferences for saving chosen folder URI
    implementation(libs.androidx.datastore.preferences)

    // Background downloading service & worker
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.kotlinx.coroutines.android)

    // Desugaring for NewPipeExtractor compatibility on Android (includes NIO)
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs_nio:2.0.4")

    // NewPipeExtractor core extractor library for native YouTube stream resolution on Android
    implementation("com.github.TeamNewPipe.NewPipeExtractor:extractor:v0.24.8")

    debugImplementation(libs.androidx.ui.tooling)
}
`,
  },
  {
    path: 'app/proguard-rules.pro',
    category: 'gradle',
    description: 'ProGuard rules for NewPipeExtractor, OkHttp, and Coroutines',
    content: `# Proguard rules for MediaDrop
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

## Rules for NewPipeExtractor
-keep class org.mozilla.javascript.** { *; }
-keep class org.mozilla.classfile.ClassFileWriter
-dontwarn org.mozilla.javascript.tools.**
-keep class org.schabi.newpipe.extractor.** { *; }
-dontwarn org.schabi.newpipe.extractor.**
`,
  },
  {
    path: 'build.gradle.kts',
    category: 'gradle',
    description: 'Root project build script configuring Android Gradle Plugin and Kotlin Compose',
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`,
  },
  {
    path: 'settings.gradle.kts',
    category: 'gradle',
    description: 'Root settings configuring plugin and dependency repositories and submodules',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = java.net.URI("https://jitpack.io") }
    }
}

rootProject.name = "MediaDrop"
include(":app")
`,
  },
  {
    path: 'gradle/libs.versions.toml',
    category: 'gradle',
    description: 'Modern Gradle version catalog containing AGP 8.8, Kotlin 2.1, Compose, and OkHttp',
    content: `[versions]
agp = "8.8.0"
kotlin = "2.1.0"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.10.0"
composeBom = "2025.01.00"
coroutines = "1.10.1"
okhttp = "4.12.0"
documentfile = "1.0.1"
datastore = "1.1.2"
workManager = "2.10.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }

okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }
androidx-documentfile = { group = "androidx.documentfile", name = "documentfile", version.ref = "documentfile" }
androidx-datastore-preferences = { group = "androidx.datastore", name = "datastore-preferences", version.ref = "datastore" }
androidx-work-runtime-ktx = { group = "androidx.work", name = "work-runtime-ktx", version.ref = "workManager" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`,
  },
  {
    path: 'gradle.properties',
    category: 'gradle',
    description: 'Gradle JVM and AndroidX configuration properties',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`,
  },
];
