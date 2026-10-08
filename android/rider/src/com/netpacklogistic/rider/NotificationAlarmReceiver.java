package com.netpacklogistic.rider;

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
    private static final String TAG = "NetPackRider";
    public static final String CHANNEL_ID = "netpack_rider_alerts";
    public static final String PREFS_NAME = "netpack_rider_prefs";
    public static final String KEY_SERVER_URL = "server_url";
    public static final String KEY_LAST_PICKUP_ID = "last_pickup_id";
    public static final String DEFAULT_SERVER_URL = "https://netpackintegration.vercel.app";

    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. Re-arm the next alarm for continuous background monitoring (every 60s)
        rearmAlarm(context);

        // 2. Check if this is a direct test trigger
        if (intent != null && "ACTION_TEST_RIDER_ALERT".equals(intent.getAction())) {
            fireNotification(
                context,
                200,
                "🚨 New Pickup Assigned (Test)",
                "Pickup at Thamel Marg, Kathmandu - Pashmina & Woolen Shawls. Tap to view dispatch details."
            );
            return;
        }

        // 3. Perform network check in background thread
        new Thread(() -> checkBackendForPickups(context)).start();
    }

    private void rearmAlarm(Context context) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent alarmIntent = new Intent(context, NotificationAlarmReceiver.class);
            alarmIntent.setAction("com.netpacklogistic.rider.CHECK_ALERTS");

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pi = PendingIntent.getBroadcast(context, 2001, alarmIntent, flags);
            long nextTrigger = SystemClock.elapsedRealtime() + (60 * 1000); // 60s from now

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, nextTrigger, pi);
            } else {
                am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, nextTrigger, pi);
            }
        } catch (Throwable e) {
            Log.e(TAG, "Error rearming rider alert alarm: " + e.getMessage());
        }
    }

    private void checkBackendForPickups(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String serverUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL);
        int lastId = prefs.getInt(KEY_LAST_PICKUP_ID, 0);

        HttpURLConnection conn = null;
        try {
            String endpoint = serverUrl.replaceAll("/+$", "") + "/api/pickups/live-alerts";
            if (lastId > 0) {
                endpoint += "?since_id=" + lastId;
            }
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

                JSONObject res = new JSONObject(sb.toString());
                int latestId = res.optInt("latestId", 0);
                boolean hasNew = res.optBoolean("hasNew", false);

                if (lastId == 0) {
                    // First run: save current high watermark
                    prefs.edit().putInt(KEY_LAST_PICKUP_ID, latestId).apply();
                } else if (hasNew && latestId > lastId) {
                    JSONArray pickups = res.optJSONArray("newPickups");
                    String alertTitle = "🚨 New Pickup Order Assigned!";
                    String alertBody = "You have a new pickup assignment waiting.";

                    if (pickups != null && pickups.length() > 0) {
                        JSONObject first = pickups.getJSONObject(0);
                        String addr = first.optString("pickupAddress", "Kathmandu");
                        String commodity = first.optString("commodity", "Consignment");
                        alertBody = "Pickup: " + addr + " (" + commodity + ")";
                    }

                    prefs.edit().putInt(KEY_LAST_PICKUP_ID, latestId).apply();
                    fireNotification(context, latestId, alertTitle, alertBody);
                }
            }
        } catch (Exception e) {
            Log.d(TAG, "Rider alert check error: " + e.getMessage());
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
                "NetPack Rider Dispatch Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Urgent pickup orders, field dispatch alerts, and live routing");
            channel.enableLights(true);
            channel.setLightColor(Color.parseColor("#F59E0B"));
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 400, 200, 400, 200, 600});
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            Uri alertSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            channel.setSound(alertSound, audioAttributes);

            nm.createNotificationChannel(channel);
        }
    }

    public static void fireNotification(Context context, int notifId, String title, String body) {
        createNotificationChannel(context);
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Intent clickIntent = new Intent(context, MainActivity.class);
        clickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        clickIntent.putExtra("pickup_id", notifId);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pi = PendingIntent.getActivity(context, notifId, clickIntent, flags);
        Uri alertSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(context);
            builder.setPriority(Notification.PRIORITY_MAX);
        }

        builder.setContentTitle(title)
               .setContentText(body)
               .setSmallIcon(R.drawable.ic_launcher)
               .setLargeIcon(BitmapFactory.decodeResource(context.getResources(), R.drawable.ic_launcher))
               .setAutoCancel(true)
               .setContentIntent(pi)
               .setSound(alertSound)
               .setVibrate(new long[]{0, 400, 200, 400, 200, 600})
               .setStyle(new Notification.BigTextStyle().bigText(body));

        nm.notify(notifId, builder.build());
    }
}
