package com.netpacklogistic.rider;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.StrictMode;
import android.os.SystemClock;
import android.provider.MediaStore;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;

public class MainActivity extends Activity {
    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorLayout;
    private TextView errorText;
    private ValueCallback<Uri[]> fileUploadCallback;
    private static final int FILE_CHOOSER_REQUEST_CODE = 3001;
    private static final int PERMISSION_REQUEST_CODE = 3002;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Safeguard: Register uncaught exception handler to prevent any fatal crash popups
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            android.util.Log.e("NetPackRider", "Uncaught Exception in " + thread.getName(), throwable);
        });

        // Relax strict mode VM policy for camera capture file intents safely
        try {
            StrictMode.VmPolicy.Builder vmBuilder = new StrictMode.VmPolicy.Builder();
            StrictMode.setVmPolicy(vmBuilder.build());
        } catch (Throwable ignored) {}

        // Status bar & window styling
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Window window = getWindow();
                window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                window.setStatusBarColor(Color.parseColor("#0D1B2A"));
                window.setNavigationBarColor(Color.parseColor("#050C14"));
            }
        } catch (Throwable ignored) {}

        // Initialize Rider Notification Channel & Schedule Background Alarm safely
        try {
            NotificationAlarmReceiver.createNotificationChannel(this);
            BootReceiver.scheduleAlertChecks(this);
        } catch (Throwable t) {
            android.util.Log.e("NetPackRider", "Failed to schedule alerts", t);
        }

        // Request runtime permissions on modern Android
        try {
            requestRequiredPermissions();
        } catch (Throwable ignored) {}

        // Build Programmatic UI (Robust, no XML layout inflation dependency)
        try {
            FrameLayout rootLayout = new FrameLayout(this);
            rootLayout.setBackgroundColor(Color.parseColor("#0D1B2A"));

            webView = new WebView(this);
            webView.setBackgroundColor(Color.parseColor("#0D1B2A"));
            configureWebView(webView);

            progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
            progressBar.setMax(100);
            progressBar.setProgress(0);
            progressBar.setVisibility(View.GONE);
            FrameLayout.LayoutParams pbParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, 8, Gravity.TOP
            );

            setupErrorLayout();

            rootLayout.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
            ));
            rootLayout.addView(progressBar, pbParams);
            rootLayout.addView(errorLayout, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
            ));

            setContentView(rootLayout);

            // Load Initial URL
            loadRiderApp();
        } catch (Throwable t) {
            android.util.Log.e("NetPackRider", "Failed to initialize UI", t);
        }
    }

    private void configureWebView(WebView wv) {
        WebSettings settings = wv.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        wv.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentSelectionIntent.setType("image/*");

                Intent[] intentArray = takePictureIntent.resolveActivity(getPackageManager()) != null
                    ? new Intent[]{takePictureIntent}
                    : new Intent[0];

                Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "Capture Parcel Proof or Select Image");
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

                startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
                return true;
            }
        });

        wv.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("tel:") || url.startsWith("mailto:") ||
                    url.startsWith("whatsapp:") || url.startsWith("geo:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {
                        return true;
                    }
                }
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                errorLayout.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showErrorScreen("Unable to reach NetPack Dispatch server.");
                }
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                showErrorScreen("Dispatch connection error (" + description + ").");
            }
        });
    }

    private void setupErrorLayout() {
        errorLayout = new LinearLayout(this);
        errorLayout.setOrientation(LinearLayout.VERTICAL);
        errorLayout.setGravity(Gravity.CENTER);
        errorLayout.setBackgroundColor(Color.parseColor("#0D1B2A"));
        errorLayout.setPadding(48, 48, 48, 48);
        errorLayout.setVisibility(View.GONE);

        TextView title = new TextView(this);
        title.setText("NetPack Rider Dispatch");
        title.setTextColor(Color.parseColor("#F59E0B"));
        title.setTextSize(24);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, 0, 0, 16);

        errorText = new TextView(this);
        errorText.setText("Unable to connect to dispatch server.");
        errorText.setTextColor(Color.WHITE);
        errorText.setTextSize(16);
        errorText.setGravity(Gravity.CENTER);
        errorText.setPadding(0, 0, 0, 32);

        Button retryBtn = new Button(this);
        retryBtn.setText("Retry Connection");
        retryBtn.setBackgroundColor(Color.parseColor("#F59E0B"));
        retryBtn.setTextColor(Color.parseColor("#0D1B2A"));
        retryBtn.setOnClickListener(v -> loadRiderApp());

        Button settingsBtn = new Button(this);
        settingsBtn.setText("Server Settings / Test");
        settingsBtn.setBackgroundColor(Color.parseColor("#1B2A47"));
        settingsBtn.setTextColor(Color.WHITE);
        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        );
        btnParams.setMargins(0, 24, 0, 0);
        settingsBtn.setLayoutParams(btnParams);
        settingsBtn.setOnClickListener(v -> showServerSettingsDialog());

        errorLayout.addView(title);
        errorLayout.addView(errorText);
        errorLayout.addView(retryBtn);
        errorLayout.addView(settingsBtn);
    }

    private void showErrorScreen(String msg) {
        errorText.setText(msg);
        webView.setVisibility(View.GONE);
        errorLayout.setVisibility(View.VISIBLE);
    }

    private void loadRiderApp() {
        SharedPreferences prefs = getSharedPreferences(
            NotificationAlarmReceiver.PREFS_NAME, Context.MODE_PRIVATE
        );
        String serverUrl = prefs.getString(
            NotificationAlarmReceiver.KEY_SERVER_URL,
            NotificationAlarmReceiver.DEFAULT_SERVER_URL
        );
        String targetUrl = serverUrl.replaceAll("/+$", "") + "/pickup-pwa";
        webView.loadUrl(targetUrl);
    }

    private void showServerSettingsDialog() {
        SharedPreferences prefs = getSharedPreferences(
            NotificationAlarmReceiver.PREFS_NAME, Context.MODE_PRIVATE
        );
        String currentUrl = prefs.getString(
            NotificationAlarmReceiver.KEY_SERVER_URL,
            NotificationAlarmReceiver.DEFAULT_SERVER_URL
        );

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Rider Dispatch Server Settings");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(40, 20, 40, 20);

        TextView info = new TextView(this);
        info.setText("Enter server origin (e.g. http://192.168.1.6:8000 or production domain):");
        info.setPadding(0, 0, 0, 16);
        layout.addView(info);

        final EditText input = new EditText(this);
        input.setText(currentUrl);
        layout.addView(input);

        builder.setView(layout);

        builder.setPositiveButton("Save & Reload", (dialog, which) -> {
            String newUrl = input.getText().toString().trim();
            if (!newUrl.isEmpty()) {
                prefs.edit().putString(NotificationAlarmReceiver.KEY_SERVER_URL, newUrl).apply();
                Toast.makeText(this, "Rider Server URL updated!", Toast.LENGTH_SHORT).show();
                loadRiderApp();
            }
        });

        builder.setNeutralButton("Test Rider Alert (5s)", (dialog, which) -> {
            scheduleTestRiderAlert();
            Toast.makeText(
                this,
                "Rider Alert scheduled in 5s! Swipe away or close app to test background chime & notification.",
                Toast.LENGTH_LONG
            ).show();
        });

        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    private void scheduleTestRiderAlert() {
        try {
            AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent intent = new Intent(this, NotificationAlarmReceiver.class);
            intent.setAction("ACTION_TEST_RIDER_ALERT");

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pi = PendingIntent.getBroadcast(this, 9998, intent, flags);
            long triggerAt = SystemClock.elapsedRealtime() + 5000; // 5 seconds from now

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
            } else {
                am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
            }
        } catch (Throwable e) {
            android.util.Log.e("NetPackRider", "Error scheduling test rider alert", e);
        }
    }

    private void requestRequiredPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            java.util.ArrayList<String> permList = new java.util.ArrayList<>();
            permList.add(Manifest.permission.ACCESS_FINE_LOCATION);
            permList.add(Manifest.permission.ACCESS_COARSE_LOCATION);
            permList.add(Manifest.permission.CAMERA);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permList.add(Manifest.permission.POST_NOTIFICATIONS);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                permList.add(Manifest.permission.BLUETOOTH_SCAN);
                permList.add(Manifest.permission.BLUETOOTH_CONNECT);
            }

            String[] perms = permList.toArray(new String[0]);
            requestPermissions(perms, PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (fileUploadCallback == null) return;
            Uri[] results = null;
            if (resultCode == RESULT_OK) {
                if (data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
            }
            fileUploadCallback.onReceiveValue(results);
            fileUploadCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        } else if (keyCode == KeyEvent.KEYCODE_MENU) {
            showServerSettingsDialog();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
