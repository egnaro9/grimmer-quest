package com.glimmerquest.game;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Force WebView background to match app theme
        getWindow().getDecorView().setBackgroundColor(0xFF0B0B13);
    }
}
