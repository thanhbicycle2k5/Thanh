import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { handleNativeAIRequest } from './nativeAI';

const SCHEDULY_URL = process.env.EXPO_PUBLIC_SCHEDULY_URL ?? 'https://task2goal.vercel.app';
const SCHEDULY_ORIGIN = new URL(SCHEDULY_URL).origin;
const STEADENT_URL = 'https://steadent.vercel.app/';
const STEADENT_ORIGIN = new URL(STEADENT_URL).origin;

if (!SCHEDULY_URL.startsWith('https://')) {
  throw new Error('The Android app must load Scheduly from a secure HTTPS URL.');
}

function isAllowedTask2GoalUrl(candidate: string): boolean {
  try {
    return new URL(candidate).origin === SCHEDULY_ORIGIN;
  } catch {
    return false;
  }
}

function isAllowedAppUrl(candidate: string): boolean {
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && (
      url.origin === SCHEDULY_ORIGIN || url.origin === STEADENT_ORIGIN
    );
  } catch {
    return false;
  }
}

const bridgeScript = `
(function () {
  if (window.location.origin !== ${JSON.stringify(SCHEDULY_ORIGIN)}) return true;
  if (window.schedulyNativeAI) return true;
  var nextId = 0;
  var pending = new Map();
  window.schedulyNativeAIReceive = function (raw) {
    var message = typeof raw === 'string' ? JSON.parse(raw) : raw;
    var request = pending.get(message.id);
    if (!request) return;
    if (message.type === 'progress') {
      if (request.onProgress) request.onProgress(message.progress);
      return;
    }
    pending.delete(message.id);
    if (request.signal && request.abort) request.signal.removeEventListener('abort', request.abort);
    if (message.type === 'error') request.reject(new Error(message.error || 'Native AI failed.'));
    else request.resolve(message.result);
  };
  window.schedulyNativeAI = {
    call: function (action, payload, onProgress, signal) {
      var id = 'scheduly-' + (++nextId) + '-' + Date.now();
      return new Promise(function (resolve, reject) {
        var request = { resolve: resolve, reject: reject, onProgress: onProgress, signal: signal, abort: null };
        request.abort = function () {
          pending.delete(id);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            id: 'cancel-' + id,
            action: 'cancel',
            payload: { targetId: id }
          }));
          reject(new Error('Generation stopped.'));
        };
        pending.set(id, request);
        if (signal) {
          if (signal.aborted) {
            request.abort();
            return;
          }
          signal.addEventListener('abort', request.abort, { once: true });
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ id: id, action: action, payload: payload || {} }));
      });
    }
  };
  return true;
})();
true;
`;

type BridgeRequest = {
  id: string;
  action: 'status' | 'prepare' | 'chat' | 'cancel';
  payload?: Record<string, unknown>;
};

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [webViewUrl, setWebViewUrl] = useState(SCHEDULY_URL);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const sendToWeb = (message: Record<string, unknown>) => {
    const encoded = JSON.stringify(JSON.stringify(message));
    webViewRef.current?.injectJavaScript(`window.schedulyNativeAIReceive?.(${encoded}); true;`);
  };

  const onMessage = async (event: WebViewMessageEvent) => {
    if (!isAllowedTask2GoalUrl(event.nativeEvent.url)) {
      console.warn('Ignored native AI bridge message from an untrusted origin.');
      return;
    }

    let request: BridgeRequest;
    try {
      request = JSON.parse(event.nativeEvent.data) as BridgeRequest;
      if (!request || typeof request.id !== 'string' || typeof request.action !== 'string') {
        throw new Error('Invalid native AI request.');
      }
    } catch (error) {
      console.warn('Invalid Scheduly native bridge message:', error);
      return;
    }

    if (request.action === 'cancel') {
      await handleNativeAIRequest('cancel', request.payload ?? {}, () => undefined);
      return;
    }

    try {
      const result = await handleNativeAIRequest(
        request.action,
        request.payload ?? {},
        (progress) => sendToWeb({ id: request.id, type: 'progress', progress }),
      );
      sendToWeb({ id: request.id, type: 'resolve', result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Native on-device AI failed.';
      sendToWeb({ id: request.id, type: 'error', error: message });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ uri: webViewUrl }}
        style={styles.webView}
        originWhitelist={['https://*']}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        injectedJavaScriptBeforeContentLoaded={bridgeScript}
        onLoadEnd={(event) => {
          if (isAllowedTask2GoalUrl(event.nativeEvent.url)) {
            webViewRef.current?.injectJavaScript(bridgeScript);
          }
        }}
        onMessage={onMessage}
        onNavigationStateChange={(navigation) => setCanGoBack(navigation.canGoBack)}
        onOpenWindow={(event) => {
          const targetUrl = event.nativeEvent.targetUrl;
          if (!isAllowedAppUrl(targetUrl)) {
            console.warn('Blocked a new window for an untrusted URL.');
            return;
          }
          setWebViewUrl(targetUrl);
        }}
        onShouldStartLoadWithRequest={(request) => isAllowedAppUrl(request.url)}
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webView: { flex: 1 },
});
