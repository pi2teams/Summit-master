import axios from "axios";

const PI_API_BASE = "https://api.minepi.com/v2";

function getPiKeyHeader() {
  const key = process.env.PI_API_KEY;
  if (!key) throw new Error("missing_pi_api_key");
  return { Authorization: `Key ${key}` };
}

export async function piGetMe(accessToken: string) {
  const { data } = await axios.get(`${PI_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data as { uid: string; username: string };
}

export async function piGetPayment(paymentId: string) {
  const { data } = await axios.get(`${PI_API_BASE}/payments/${paymentId}`, {
    headers: getPiKeyHeader(),
  });
  return data as any;
}

export async function piApprovePayment(paymentId: string) {
  const { data } = await axios.post(`${PI_API_BASE}/payments/${paymentId}/approve`, {}, {
    headers: getPiKeyHeader(),
  });
  return data;
}

export async function piCompletePayment(paymentId: string, txid: string) {
  const { data } = await axios.post(`${PI_API_BASE}/payments/${paymentId}/complete`, { txid }, {
    headers: getPiKeyHeader(),
  });
  return data;
}

export async function piCancelPayment(paymentId: string) {
  const { data } = await axios.post(`${PI_API_BASE}/payments/${paymentId}/cancel`, {}, {
    headers: getPiKeyHeader(),
  });
  return data;
}
