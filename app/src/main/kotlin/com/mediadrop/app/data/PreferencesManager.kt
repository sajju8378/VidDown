package com.mediadrop.app.data

import android.content.Context
import android.net.Uri
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "media_drop_prefs")

class PreferencesManager(private val context: Context) {
    companion object {
        val KEY_FOLDER_URI = stringPreferencesKey("chosen_folder_uri")
        val KEY_FOLDER_NAME = stringPreferencesKey("chosen_folder_name")
        val KEY_AUTO_START = booleanPreferencesKey("auto_start_on_share")
        val KEY_WIFI_ONLY = booleanPreferencesKey("wifi_only")
        val KEY_NOTIFICATIONS = booleanPreferencesKey("notifications_enabled")
    }

    val chosenFolderUri: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[KEY_FOLDER_URI]
    }

    val chosenFolderName: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_FOLDER_NAME] ?: "Downloads / MediaDrop"
    }

    val autoStartOnShare: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_AUTO_START] ?: true
    }

    val wifiOnly: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_WIFI_ONLY] ?: false
    }

    val notificationsEnabled: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_NOTIFICATIONS] ?: true
    }

    suspend fun saveChosenFolder(uri: Uri, folderName: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_FOLDER_URI] = uri.toString()
            prefs[KEY_FOLDER_NAME] = folderName
        }
    }

    suspend fun setAutoStartOnShare(enabled: Boolean) {
        context.dataStore.edit { prefs -> prefs[KEY_AUTO_START] = enabled }
    }

    suspend fun setWifiOnly(enabled: Boolean) {
        context.dataStore.edit { prefs -> prefs[KEY_WIFI_ONLY] = enabled }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        context.dataStore.edit { prefs -> prefs[KEY_NOTIFICATIONS] = enabled }
    }
}
