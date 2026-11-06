# Scheduly AI for Android

This companion Android app opens the deployed Task2Goal web interface in a WebView, keeps Steadent links inside that WebView, and routes the **On-device AI** provider to native `llama.cpp` through `llama.rn`. This avoids the WebGPU path that can fail on some Android graphics drivers.

Steadent uses Supabase authentication, while Task2Goal uses Firebase Authentication. Embedding Steadent does not share or transfer the Task2Goal login session; Steadent must separately implement a trusted single-sign-on integration to accept the Task2Goal identity.

## Build

Requirements: Node.js, Android Studio/Android SDK, and a device running Android.

1. From this folder, install dependencies with `npm install`.
2. Set `EXPO_PUBLIC_SCHEDULY_URL` if the default `https://task2goal.vercel.app` origin is not the Task2Goal deployment you want. The WebView also allows the `https://steadent.vercel.app` origin so the existing Steadent button opens in-app.
3. Build a standalone release APK locally with `npm run build:android`. This bundles the JavaScript and does not require Metro or a connected phone. The APK is written to `android/app/build/outputs/apk/release/app-release.apk`.

Alternatively, build an installable APK with `npx eas-cli@latest build --platform android --profile preview` (after `npx eas-cli@latest build:configure` and signing in). Do not distribute a debug APK from `npm run android`; debug builds expect Metro to be running and show "Unable to load script" otherwise.

Expo Go is not supported because `llama.rn` includes native C++ libraries. Native changes require rebuilding the APK.

## Model

The first use of **On-device AI** downloads the Apache-2.0 `SmolLM3-Q4_K_M.gguf` model (about 1.9 GB) from the pinned `ggml-org/SmolLM3-3B-GGUF` Hugging Face revision into the app's private documents directory. Later app launches reuse that file and initialize llama.cpp again. The model file from PocketPal is private to PocketPal and is not accessible to this app.

The runtime uses a 2,048-token context and tries Android OpenCL acceleration first, then CPU if native GPU initialization fails. Generation speed and whether OpenCL is available depend on the phone. In this companion APK, Settings should show `SmolLM3-3B-Q4_K_M.gguf`; `Qwen3-0.6B-q4f16_1-MLC` is the browser/WebGPU model and is not the native APK model.
