package com.mediadrop.app.service

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

                        // Completed
                        showCompletedNotification(fileName)
                    } catch (e: Exception) {
                        showFailedNotification(fileName, e.message ?: "Download failed")
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
            ).apply {
                description = "Shows live download progress and speed"
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildProgressNotification(fileName: String, progress: Int, max: Int, speedBps: Long): android.app.Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val cancelIntent = Intent(this, DownloadForegroundService::class.java).apply {
            action = ACTION_CANCEL
        }
        val cancelPendingIntent = PendingIntent.getService(
            this, 1, cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val speedText = if (speedBps > 0) formatSpeed(speedBps) else "Connecting..."

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Downloading: $fileName")
            .setContentText("$progress% • $speedText")
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setProgress(max, progress, max == 0)
            .setOngoing(true)
            .setContentIntent(openPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Cancel", cancelPendingIntent)
            .build()
    }

    private fun showCompletedNotification(fileName: String) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Download Complete")
            .setContentText(fileName)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setAutoCancel(true)
            .build()
        notificationManager.notify(NOTIFICATION_ID + 1, notification)
    }

    private fun showFailedNotification(fileName: String, error: String) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Download Failed: $fileName")
            .setContentText(error)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setAutoCancel(true)
            .build()
        notificationManager.notify(NOTIFICATION_ID + 2, notification)
    }

    private fun formatSpeed(bytesPerSec: Long): String {
        return when {
            bytesPerSec >= 1024 * 1024 -> String.format("%.1f MB/s", bytesPerSec / (1024.0 * 1024.0))
            bytesPerSec >= 1024 -> String.format("%.0f KB/s", bytesPerSec / 1024.0)
            else -> "$bytesPerSec B/s"
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
