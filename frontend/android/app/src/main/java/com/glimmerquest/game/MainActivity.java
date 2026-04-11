package com.glimmerquest.game;

import android.graphics.Color;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Force window/decor background to brand color
        getWindow().getDecorView().setBackgroundColor(0xFFFF0000);

        // Force Capacitor WebView background to brand color
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.parseColor("#FF0000"));
        }
    }
}
