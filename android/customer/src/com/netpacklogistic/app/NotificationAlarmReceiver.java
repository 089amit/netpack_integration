package com.netpacklogistic.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class NotificationAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "NetPackNotif";
    public static final String CHANNEL_ID = "netpack_customer_channel";
    public static final String PREFS_NAME = "netpack_customer_prefs";
    public static final String KEY_SERVER_URL = "server_url";
    public static final String KEY_LAST_NOTIF_ID = "last_notification_id";
    public static final String DEFAULT_SERVER_URL = "https://netpackintegration.vercel.app";

    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. Re-arm the next alarm for continuous background monitoring (every 60s)
        rearmAlarm(context);

        // 2. Check if this is a direct test trigger
        if (intent != null && "ACTION_TEST_NOTIFICATION".equals(intent.getAction())) {
            fireNotification(
                context,
                100,
                "NetPack Test Notification",
                "Background notifications are working! You will receive updates even when NetPack is closed."
            );
            return;
        }

        // 3. Perform network check in background thread
        new Thread(() -> checkBackendForNotifications(context)).start();
    }

    private void rearmAlarm(Context context) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent alarmIntent = new Intent(context, NotificationAlarmReceiver.class);
            alarmIntent.setAction("com.netpacklogistic.app.CHECK_NOTIFICATIONS");

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pi = PendingIntent.getBroadcast(context, 1001, alarmIntent, flags);
            long nextTrigger = SystemClock.elapsedRealtime() + (60 * 1000); // 60s from now

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, nextTrigger, pi);
            } else {
                am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, nextTrigger, pi);
            }
        } catch (Throwable e) {
            Log.e(TAG, "Error rearming customer alarm: " + e.getMessage());
        }
    }

    private void checkBackendForNotifications(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String serverUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
        int lastId = prefs.getInt(KEY_LAST_NOTIF_ID, 0);

        HttpURLConnection conn = null;
        try {
            String endpoint = serverUrl.replaceAll("/+$", "") + "/api/notification/getNotifications";
            URL url = new URL(endpoint);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setRequestProperty("Accept", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                InputStream is = conn.getInputStream();
                BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                JSONArray array = new JSONArray(sb.toString());
                if (array.length() > 0) {
                    JSONObject newest = array.getJSONObject(0);
                    int newestId = newest.optInt("id", 0);

                    if (lastId == 0) {
                        // First run: establish baseline
                        prefs.edit().putInt(KEY_LAST_NOTIF_ID, newestId).apply();
                    } else if (newestId > lastId) {
                        // Found new notification!
                        String title = newest.optString("title", "NetPack Logistics Update");
                        String body = newest.optString("body", "");
                        if (body.isEmpty()) {
                            body = newest.optString("description", "You have a new shipment update.");
                        }

                        prefs.edit().putInt(KEY_LAST_NOTIF_ID, newestId).apply();
                        fireNotification(context, newestId, title, body);
                    }
                }
            }
        } catch (Exception e) {
            Log.d(TAG, "Notification check error: " + e.getMessage());
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "NetPack Customer Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Real-time package tracking and dispatch updates");
            channel.enableLights(true);
            channel.setLightColor(Color.parseColor("#F59E0B"));
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 300, 200, 300});
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            Uri defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();
            channel.setSound(defaultSound, audioAttributes);

            nm.createNotificationChannel(channel);
        }
    }

    public static void fireNotification(Context context, int notifId, String title, String body) {
        createNotificationChannel(context);
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Intent clickIntent = new Intent(context, MainActivity.class);
        clickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        clickIntent.putExtra("notification_id", notifId);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pi = PendingIntent.getActivity(context, notifId, clickIntent, flags);
        Uri defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(context);
            builder.setPriority(Notification.PRIORITY_HIGH);
        }

        builder.setContentTitle(title)
               .setContentText(body)
               .setSmallIcon(R.drawable.ic_launcher)
               .setLargeIcon(BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_launcher))
               .setAutoCancel(true)
               .setContentIntent(pi)
               .setSound(defaultSound)
               .setVibrate(new long[]{0, 300, 200, 300})
               .setStyle(new Notification.BigTextStyle().bigText(body));

        nm.notify(notifId, builder.build());
    }
}
