package com.mediadrop.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.mediadrop.app.data.DownloadItem
import com.mediadrop.app.data.DownloadStatus
import com.mediadrop.app.data.MediaType

@Composable
fun HistoryScreen() {
    val context = LocalContext.current

    // Sample history list (in production backed by Room database)
    val historyItems = remember {
        mutableStateListOf(
            DownloadItem(
                id = "1",
                originalUrl = "https://example.com/videos/nature_wildlife_4k.mp4",
                fileName = "nature_wildlife_4k.mp4",
                mediaType = MediaType.VIDEO_MP4,
                mimeType = "video/mp4",
                totalBytes = 42_500_000L,
                downloadedBytes = 42_500_000L,
                progress = 1.0f,
                status = DownloadStatus.COMPLETED
            ),
            DownloadItem(
                id = "2",
                originalUrl = "https://example.com/audio/tech_talk_ep42.mp3",
                fileName = "tech_talk_ep42.mp3",
                mediaType = MediaType.AUDIO_MP3,
                mimeType = "audio/mpeg",
                totalBytes = 18_200_000L,
                downloadedBytes = 18_200_000L,
                progress = 1.0f,
                status = DownloadStatus.COMPLETED
            ),
            DownloadItem(
                id = "3",
                originalUrl = "https://example.com/images/wallpaper_tokyo_cyberpunk.jpg",
                fileName = "wallpaper_tokyo_cyberpunk.jpg",
                mediaType = MediaType.IMAGE,
                mimeType = "image/jpeg",
                totalBytes = 3_400_000L,
                downloadedBytes = 3_400_000L,
                progress = 1.0f,
                status = DownloadStatus.COMPLETED
            )
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Download History",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${historyItems.size} downloaded files",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (historyItems.isNotEmpty()) {
                IconButton(onClick = { historyItems.clear() }) {
                    Icon(Icons.Default.DeleteSweep, contentDescription = "Clear All")
                }
            }
        }

        if (historyItems.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Default.FolderOpen,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "No Downloads Yet",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "Share media links from Chrome, Twitter, or Reddit to start downloading.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(historyItems, key = { it.id }) { item ->
                    HistoryItemCard(
                        item = item,
                        onOpen = {
                            // Launch Android intent to view media in default player
                            item.savedFileUri?.let { uriStr ->
                                val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                                    setDataAndType(Uri.parse(uriStr), item.mimeType)
                                    flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                                }
                                try {
                                    context.startActivity(viewIntent)
                                } catch (_: Exception) {}
                            }
                        },
                        onShare = {
                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                type = item.mimeType
                                putExtra(Intent.EXTRA_TEXT, item.originalUrl)
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Share Media"))
                        },
                        onDelete = {
                            historyItems.remove(item)
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun HistoryItemCard(
    item: DownloadItem,
    onOpen: () -> Unit,
    onShare: () -> Unit,
    onDelete: () -> Unit
) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            val icon = when (item.mediaType) {
                MediaType.VIDEO_MP4 -> Icons.Default.Movie
                MediaType.AUDIO_MP3 -> Icons.Default.Audiotrack
                MediaType.IMAGE -> Icons.Default.Image
                else -> Icons.Default.InsertDriveFile
            }

            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
                modifier = Modifier.size(44.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        icon,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.fileName,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${formatBytes(item.totalBytes)} • ${item.mimeType}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Row {
                IconButton(onClick = onShare) {
                    Icon(Icons.Default.Share, contentDescription = "Share", modifier = Modifier.size(20.dp))
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", modifier = Modifier.size(20.dp))
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
