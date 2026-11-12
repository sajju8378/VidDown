package com.mediadrop.app.ui.screens

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
import androidx.compose.ui.graphics.Color
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

    // Chosen folder state
    val chosenFolderUri by preferencesManager.chosenFolderUri.collectAsState(initial = null)
    val chosenFolderName by preferencesManager.chosenFolderName.collectAsState(initial = "Select Destination Folder")

    // Download state
    var downloadProgress by remember { mutableFloatStateOf(0f) }
    var downloadSpeed by remember { mutableLongStateOf(0L) }
    var downloadedBytes by remember { mutableLongStateOf(0L) }
    var totalBytes by remember { mutableLongStateOf(0L) }
    var downloadStatus by remember { mutableStateOf(DownloadStatus.IDLE) }
    var isCancelled by remember { mutableStateOf(false) }

    // Storage Access Framework Folder Picker launcher
    val folderPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocumentTree()
    ) { uri: Uri? ->
        if (uri != null) {
            // Take persistable URI permission so app can write files repeatedly
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

    // React to shared URL when incoming from external app
    LaunchedEffect(sharedUrl) {
        if (!sharedUrl.isNullOrBlank()) {
            urlInput = sharedUrl
            isProbing = true
            errorMessage = null
            try {
                probeResult = downloader.probeUrl(sharedUrl)
            } catch (e: Exception) {
                errorMessage = "Probe failed: ${e.message}"
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
        // App Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
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
                                        errorMessage = "Failed to inspect URL: ${e.message}"
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
                            text = if (downloadStatus == DownloadStatus.COMPLETED) "100%" else "${(downloadProgress * 100).toInt()}%",
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
                            text = "${formatBytes(downloadedBytes)} / ${if (totalBytes > 0) formatBytes(totalBytes) else "..."}",
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
        else -> "$bytes B"
    }
}

private fun formatSpeed(bytesPerSec: Long): String {
    return when {
        bytesPerSec >= 1024 * 1024 -> String.format("%.1f MB/s", bytesPerSec / (1024.0 * 1024.0))
        bytesPerSec >= 1024 -> String.format("%.0f KB/s", bytesPerSec / 1024.0)
        else -> "$bytesPerSec B/s"
    }
}
