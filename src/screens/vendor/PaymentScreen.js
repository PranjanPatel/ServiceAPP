import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const buildHtml = (order, user) => {
  const options = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: 'ServiceApp',
    description: `${order.planName} plan (30 days)`,
    prefill: { name: user?.name, email: user?.email, contact: user?.phone },
    theme: { color: '#2563EB' },
  };
  const json = JSON.stringify(options).replace(/</g, '\\u003c');

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;background:#F8FAFC;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#64748B}</style>
</head><body>Opening secure payment...
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  function send(d){ window.ReactNativeWebView.postMessage(JSON.stringify(d)); }
  var options = ${json};
  options.handler = function (r) { send({ type: 'success', payload: r }); };
  options.modal = { ondismiss: function () { send({ type: 'cancel' }); } };
  var rzp = new Razorpay(options);
  rzp.on('payment.failed', function (r) { send({ type: 'failed', message: r.error && r.error.description }); });
  rzp.open();
</script></body></html>`;
};

export default function PaymentScreen({ route, navigation }) {
  const { plan } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setOrder(await api('/payments/create-order', { method: 'POST', body: JSON.stringify({ plan }) }));
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [plan]);

  const onMessage = async (e) => {
    let msg;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }

    if (msg.type === 'cancel') return navigation.goBack();
    if (msg.type === 'failed') {
      return Alert.alert('Payment failed', msg.message || 'Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }

    if (msg.type === 'success') {
      try {
        setVerifying(true);
        await api('/payments/verify', { method: 'POST', body: JSON.stringify(msg.payload) });
        Alert.alert('Payment successful', 'Your plan is now active.', [
          { text: 'Great', onPress: () => navigation.popToTop() },
        ]);
      } catch (err) {
        setVerifying(false);
        Alert.alert(
          'Could not confirm payment',
          `${err.message}\n\nIf money was deducted, your plan will activate shortly. Pull to refresh on the Dashboard.`,
          [{ text: 'OK', onPress: () => navigation.popToTop() }]
        );
      }
    }
  };

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.err}>{error}</Text>
        <TouchableOpacity style={s.btn} onPress={() => navigation.goBack()}>
          <Text style={s.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order || verifying) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={s.msg}>{verifying ? 'Confirming your payment...' : 'Preparing secure payment...'}</Text>
      </View>
    );
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: buildHtml(order, user), baseUrl: 'https://checkout.razorpay.com' }}
      javaScriptEnabled
      domStorageEnabled
      onMessage={onMessage}
      // let UPI apps (upi://, intent://, phonepe://, ...) open outside the WebView
      onShouldStartLoadWithRequest={(req) => {
        if (req.url.startsWith('http') || req.url === 'about:blank') return true;
        Linking.openURL(req.url).catch(() => {});
        return false;
      }}
      startInLoadingState
      renderLoading={() => (
        <View style={s.center}><ActivityIndicator size="large" color="#2563EB" /></View>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: 30 },
  msg: { color: '#64748B', marginTop: 14 },
  err: { color: '#DC2626', textAlign: 'center', marginBottom: 16 },
  btn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  btnText: { color: '#fff', fontWeight: '700' },
});