import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { handleNativeAIRequest } from './nativeAI';

const SCHEDULY_URL = process.env.EXPO_PUBLIC_SCHEDULY_URL ?? 'https://task2goal.vercel.app';
const SCHEDULY_ORIGIN = new URL(SCHEDULY_URL).origin;

if (!SCHEDULY_URL.startsWith('https://')) {
  throw new Error('The Android app must load Scheduly from a secure HTTPS URL.');
}

function isAllowedSchedulyUrl(candidate: string): boolean {
  try {
    return new URL(candidate).origin === SCHEDULY_ORIGIN;
  } catch {
    return false;
  }
}

const bridgeScript = `
(function () {
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

  const sendToWeb = (message: Record<string, unknown>) => {
    const encoded = JSON.stringify(JSON.stringify(message));
    webViewRef.current?.injectJavaScript(`window.schedulyNativeAIReceive?.(${encoded}); true;`);
  };

  const onMessage = async (event: WebViewMessageEvent) => {
    if (!isAllowedSchedulyUrl(event.nativeEvent.url)) {
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
        source={{ uri: SCHEDULY_URL }}
        style={styles.webView}
        originWhitelist={['https://*']}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        injectedJavaScriptBeforeContentLoaded={bridgeScript}
        onLoadEnd={() => webViewRef.current?.injectJavaScript(bridgeScript)}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={(request) => isAllowedSchedulyUrl(request.url)}
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webView: { flex: 1 },
});
