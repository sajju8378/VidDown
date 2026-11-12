import { AndroidProjectFile } from '../types';

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: '.github/workflows/deploy-pages.yml',
    category: 'ci',
    description: 'GitHub Actions workflow to automatically build and deploy the web companion to GitHub Pages',
    content: `name: Deploy Web Companion to GitHub Pages

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build Web App
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`,
  },
  {
    path: '.github/workflows/build-signed-apk.yml',
    category: 'ci',
    description: 'GitHub Actions workflow to decode base64 keystore, build, and sign release APK',
    content: `name: Build & Sign Release APK

on:
  push:
    branches: [ main, master ]
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-apk:
    name: Build Signed Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew || true

      - name: Decode Keystore from Secrets
        if: "\${{ env.KEYSTORE_BASE64 != '' }}"
        env:
          KEYSTORE_BASE64: \${{ secrets.RELEASE_KEYSTORE_BASE64 }}
        run: |
          mkdir -p app/keystore
          echo "$KEYSTORE_BASE64" | base64 --decode > app/keystore/release.jks

      - name: Build Release APK with Gradle
        env:
          SIGNING_KEYSTORE_PATH: \${{ secrets.RELEASE_KEYSTORE_BASE64 != '' && 'keystore/release.jks' || '' }}
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: \${{ secrets.KEY_PASSWORD }}
        run: |
          if [ -f "gradlew" ]; then
            ./gradlew assembleRelease --stacktrace
          else
            gradle assembleRelease --stacktrace
          fi

      - name: Check Built APK Output
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
          files: app/build/outputs/apk/release/*.apk
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
    path: 'app/src/main/kotlin/com/mediadrop/app/downloader/HttpDownloader.kt',
    category: 'kotlin',
    description: 'OkHttp chunked streaming engine with byte progress and SAF DocumentFile output',
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
import java.io.InputStream
import java.io.OutputStream
import java.net.URLDecoder
import java.util.concurrent.TimeUnit

data class ProbeResult(
    val fileName: String,
    val mimeType: String,
    val mediaType: MediaType,
    val contentLength: Long
)

class HttpDownloader(private val context: Context) {

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    suspend fun probeUrl(url: String): ProbeResult = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(url)
            .head()
            .header("User-Agent", "Mozilla/5.0 (Android; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0")
            .build()

        var fileName = deriveFilename(url)
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
        ProbeResult(fileName, mimeType, mediaType, contentLength)
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

            val buffer = ByteArray(16 * 1024)
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

    private fun deriveFilename(url: String): String {
        return try {
            val uri = Uri.parse(url)
            val lastPath = uri.lastPathSegment
            if (!lastPath.isNullOrBlank() && lastPath.contains(".")) {
                URLDecoder.decode(lastPath, "UTF-8")
            } else {
                "media_\${System.currentTimeMillis()}"
            }
        } catch (_: Exception) {
            "media_\${System.currentTimeMillis()}"
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
                    maxLines = 3
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(
                        onClick = {
                            if (urlInput.isNotBlank()) {
                                scope.launch {
                                    isProbing = true
                                    errorMessage = null
                                    try {
                                        probeResult = downloader.probeUrl(urlInput.trim())
                                    } catch (e: Exception) {
                                        errorMessage = "Failed: \${e.message}"
                                    } finally {
                                        isProbing = false
                                    }
                                }
                            }
                        },
                        enabled = urlInput.isNotBlank() && !isProbing
                    ) {
                        Text(if (isProbing) "Inspecting..." else "Inspect Link")
                    }
                }
            }
        }
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
                        stopForeground(STOP_FOREGROUND_DETACH)
                        stopSelf()
                    }
                }
            }
            ACTION_CANCEL -> {
                isCancelled = true
                downloadJob?.cancel()
                stopForeground(STOP_FOREGROUND_REMOVE)
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
        create("release") {
            val keystorePath = System.getenv("SIGNING_KEYSTORE_PATH")
            if (!keystorePath.isNullOrEmpty() && File(keystorePath).exists()) {
                storeFile = File(keystorePath)
                storePassword = System.getenv("KEYSTORE_PASSWORD") ?: ""
                keyAlias = System.getenv("KEY_ALIAS") ?: ""
                keyPassword = System.getenv("KEY_PASSWORD") ?: ""
            } else {
                val debugKeystore = file("\${System.getProperty("user.home")}/.android/debug.keystore")
                if (debugKeystore.exists()) {
                    storeFile = debugKeystore
                    storePassword = "android"
                    keyAlias = "androiddebugkey"
                    keyPassword = "android"
                }
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            val releaseSigning = signingConfigs.getByName("release")
            signingConfig = if (releaseSigning.storeFile != null && releaseSigning.storeFile!!.exists()) {
                releaseSigning
            } else {
                signingConfigs.getByName("debug")
            }
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
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

    implementation(libs.okhttp)
    implementation(libs.androidx.documentfile)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.kotlinx.coroutines.android)

    debugImplementation(libs.androidx.ui.tooling)
}
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
