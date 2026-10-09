package com.netpacklogistic.rider;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.SystemClock;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            
            SharedPreferences prefs = context.getSharedPreferences(
                NotificationAlarmReceiver.PREFS_NAME, Context.MODE_PRIVATE
            );
            if (prefs.getBoolean(NotificationAlarmReceiver.KEY_IS_LOGGED_IN, false)) {
                scheduleAlertChecks(context);
            } else {
                NotificationAlarmReceiver.cancelAlerts(context);
            }
        }
    }

    public static void scheduleAlertChecks(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(
                NotificationAlarmReceiver.PREFS_NAME, Context.MODE_PRIVATE
            );
            if (!prefs.getBoolean(NotificationAlarmReceiver.KEY_IS_LOGGED_IN, false)) {
                NotificationAlarmReceiver.cancelAlerts(context);
                return;
            }

            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent alarmIntent = new Intent(context, NotificationAlarmReceiver.class);
            alarmIntent.setAction("com.netpacklogistic.rider.CHECK_ALERTS");

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pi = PendingIntent.getBroadcast(context, 2001, alarmIntent, flags);

            long triggerAtMillis = SystemClock.elapsedRealtime() + 10 * 1000;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAtMillis, pi);
            } else {
                am.setRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAtMillis, 60 * 1000, pi);
            }
        } catch (Throwable e) {
            android.util.Log.e("NetPackRider", "Error scheduling rider alert alarm", e);
        }
    }
}
