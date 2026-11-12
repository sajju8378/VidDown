package com.mediadrop.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mediadrop.app.data.PreferencesManager
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val preferencesManager = remember { PreferencesManager(context) }

    val chosenFolderName by preferencesManager.chosenFolderName.collectAsState(initial = "Downloads / MediaDrop")
    val autoStart by preferencesManager.autoStartOnShare.collectAsState(initial = true)
    val wifiOnly by preferencesManager.wifiOnly.collectAsState(initial = false)
    val notifications by preferencesManager.notificationsEnabled.collectAsState(initial = true)

    val folderPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocumentTree()
    ) { uri: Uri? ->
        if (uri != null) {
            val name = uri.lastPathSegment ?: "Chosen Folder"
            scope.launch {
                preferencesManager.saveChosenFolder(uri, name)
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
                text = "Settings",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Preferences & Storage Configuration",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(
                    text = "Storage & Downloads",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                ListItem(
                    headlineContent = { Text("Default Download Folder") },
                    supportingContent = { Text(chosenFolderName) },
                    leadingContent = { Icon(Icons.Default.Folder, contentDescription = null) },
                    trailingContent = { Icon(Icons.Default.ChevronRight, contentDescription = null) },
                    modifier = Modifier.clickable { folderPickerLauncher.launch(null) }
                )

                HorizontalDivider()

                ListItem(
                    headlineContent = { Text("Auto-start on Shared Link") },
                    supportingContent = { Text("Begin downloading immediately when shared from another app") },
                    leadingContent = { Icon(Icons.Default.Bolt, contentDescription = null) },
                    trailingContent = {
                        Switch(
                            checked = autoStart,
                            onCheckedChange = { scope.launch { preferencesManager.setAutoStartOnShare(it) } }
                        )
                    }
                )

                HorizontalDivider()

                ListItem(
                    headlineContent = { Text("Download on Wi-Fi Only") },
                    supportingContent = { Text("Conserve mobile data when streaming large files") },
                    leadingContent = { Icon(Icons.Default.Wifi, contentDescription = null) },
                    trailingContent = {
                        Switch(
                            checked = wifiOnly,
                            onCheckedChange = { scope.launch { preferencesManager.setWifiOnly(it) } }
                        )
                    }
                )

                HorizontalDivider()

                ListItem(
                    headlineContent = { Text("Download Notifications") },
                    supportingContent = { Text("Show ongoing speed and completion alerts in notification shade") },
                    leadingContent = { Icon(Icons.Default.Notifications, contentDescription = null) },
                    trailingContent = {
                        Switch(
                            checked = notifications,
                            onCheckedChange = { scope.launch { preferencesManager.setNotificationsEnabled(it) } }
                        )
                    }
                )
            }
        }

        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "About MediaDrop",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Version 1.0.0 (Release APK)\nBuilt with Kotlin 2.1 + Jetpack Compose\nTargeting Android 15 (API 35)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
