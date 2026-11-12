import { ApiDefinition } from '../data/acledaSpec';

export function generateCodeSnippet(
  lang: 'typescript' | 'java' | 'python' | 'php' | 'csharp' | 'go' | 'dart',
  api: ApiDefinition,
  config: {
    merchantPath: string;
    merchantId: string;
    loginId: string;
    password: string;
    secretKey: string;
  }
): string {
  const isFormulaA = api.hashFormula === 'A';
  const endpointName = api.endpoint;
  const fullUrl = `https://epaymentuat.acledabank.com.kh:8443/${config.merchantPath}/XPAYConnectorServiceInterfaceImplV2/XPAYConnectorServiceInterfaceImplV2RS/${endpointName}`;

  if (lang === 'typescript') {
    return `// ==========================================
// ACLEDA Toanchet Pay API: ${api.name}
// Language: Node.js / TypeScript
// ==========================================
import crypto from 'crypto';

interface AcledaConfig {
  merchantPath: string;
  merchantId: string;
  loginId: string;
  password: string;
  secretKey: string;
}

const config: AcledaConfig = {
  merchantPath: '${config.merchantPath}',
  merchantId: '${config.merchantId}',
  loginId: '${config.loginId}',
  password: '${config.password}',
  secretKey: '${config.secretKey}' // KEEP SAFE ON SERVER ONLY
};

// 1. Generate Local HMAC-SHA512 in 128-char Uppercase Hex
function generateHmacHex(message: string, secretKey: string): string {
  return crypto
    .createHmac('sha512', secretKey)
    .update(message, 'utf8')
    .digest('hex')
    .toUpperCase();
}

// 2. Prepare Payload for ${api.name}
${isFormulaA ? `const txid = 'TXN_' + Date.now();
// Formula A: merchantID + loginId + password + txid
const message = \`\${config.merchantId}\${config.loginId}\${config.password}\${txid}\`;
const hash = generateHmacHex(message, config.secretKey);

const payload = {
  loginId: config.loginId,
  password: config.password,
  merchantID: config.merchantId, // uppercase ID
  hash: hash,
  xpayTransaction: {
    txid: txid,
    purchaseAmount: '4000',
    purchaseCurrency: 'KHR',
    purchaseDate: '12-11-2026',
    purchaseDesc: 'Goods Purchase',
    invoiceid: txid,
    item: '1',
    quantity: '1',
    expiryTime: '5',
${api.id === 'api-1-account' ? '    paymentCard: "0"' : ''}${api.id === 'api-2-mpgs' ? '    paymentCard: "1"' : ''}${api.id === 'api-3-khqr-string' ? '    operationType: "5"' : ''}${api.id === 'api-4-khqr-webview' ? '    operationType: "3"' : ''}${api.id === 'api-5-deeplink' ? '    oprDevice: "android",\n    callBackUrl: "appmobile://merchant.com.kh/callback",\n    compName: "My Shop"' : ''}
  }
};` : api.id === 'api-6-status' ? `const paymentTokenid = 'KTEeOOIVfqH0vX7cCvZnSAMuKqYz'; // from openSessionV2
// Formula B: merchantId + loginId + password + paymentTokenid
const message = \`\${config.merchantId}\${config.loginId}\${config.password}\${paymentTokenid}\`;
const hash = generateHmacHex(message, config.secretKey);

const payload = {
  loginId: config.loginId,
  password: config.password,
  merchantName: config.merchantPath,
  hash: hash,
  merchantId: config.merchantId, // lowercase d
  paymentTokenid: paymentTokenid // lowercase id
};` : `const paymentTokenId = 'XM1O0NgzHqGDGcGBlYDzmHtszIQz';
const sessionId = 'C9zF1hmAwhN034o7pARwxrrMfL8z';
// Formula B: merchantId + loginId + password + paymentTokenId
const message = \`\${config.merchantId}\${config.loginId}\${config.password}\${paymentTokenId}\`;
const hash = generateHmacHex(message, config.secretKey);

const payload = {
  loginId: config.loginId,
  password: config.password,
  merchantId: config.merchantId, // lowercase d
  hash: hash,
  paymentTokenId: paymentTokenId, // uppercase I
  sessionId: sessionId,
  amount: '1',
  currency: 'USD', // MUST match original transaction
  reason: 'Customer requested refund'
};`}

// 3. Send HTTP POST to UAT (Note Port 8443)
async function execute() {
  const url = '${fullUrl}';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'X-Api-Key': 'YOUR_API_KEY' // if assigned
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log('ACLEDA Response:', JSON.stringify(data, null, 2));
}

execute().catch(console.error);
`;
  }

  if (lang === 'java') {
    return `// ==========================================
// ACLEDA Toanchet Pay API: ${api.name}
// Official Java Source of Truth Implementation
// ==========================================
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class AcledaToanchetClient {
    private static final String MERCHANT_PATH = "${config.merchantPath}";
    private static final String MERCHANT_ID = "${config.merchantId}";
    private static final String LOGIN_ID = "${config.loginId}";
    private static final String PASSWORD = "${config.password}";
    private static final String SECRET_KEY = "${config.secretKey}";

    public static String generateHmacSHA512Hex(String message, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hmacBytes) {
                sb.append(String.format("%02X", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating HMAC-SHA512", e);
        }
    }

    public static void main(String[] args) throws Exception {
        String endpointUrl = "${fullUrl}";
        ${isFormulaA ? `String txid = "TXN" + System.currentTimeMillis();
        // Formula A: merchantID + loginId + password + txid
        String message = MERCHANT_ID + LOGIN_ID + PASSWORD + txid;
        String hash = generateHmacSHA512Hex(message, SECRET_KEY);

        String jsonPayload = """
        {
          "loginId": "%s",
          "password": "%s",
          "merchantID": "%s",
          "hash": "%s",
          "xpayTransaction": {
            "txid": "%s",
            "purchaseAmount": "4000",
            "purchaseCurrency": "KHR",
            "purchaseDate": "12-11-2026",
            "purchaseDesc": "mobile",
            "invoiceid": "%s",
            "item": "1",
            "quantity": "1",
            "expiryTime": "5"${api.id === 'api-1-account' ? ',\n            "paymentCard": "0"' : ''}${api.id === 'api-2-mpgs' ? ',\n            "paymentCard": "1"' : ''}${api.id === 'api-3-khqr-string' ? ',\n            "operationType": "5"' : ''}${api.id === 'api-4-khqr-webview' ? ',\n            "operationType": "3"' : ''}${api.id === 'api-5-deeplink' ? ',\n            "oprDevice": "android",\n            "callBackUrl": "appmobile://merchant.com.kh/callback",\n            "compName": "My Shop"' : ''}
          }
        }
        """.formatted(LOGIN_ID, PASSWORD, MERCHANT_ID, hash, txid, txid);` : api.id === 'api-6-status' ? `String paymentTokenid = "KTEeOOIVfqH0vX7cCvZnSAMuKqYz";
        // Formula B: merchantId + loginId + password + paymentTokenid
        String message = MERCHANT_ID + LOGIN_ID + PASSWORD + paymentTokenid;
        String hash = generateHmacSHA512Hex(message, SECRET_KEY);

        String jsonPayload = """
        {
          "loginId": "%s",
          "password": "%s",
          "merchantName": "%s",
          "hash": "%s",
          "merchantId": "%s",
          "paymentTokenid": "%s"
        }
        """.formatted(LOGIN_ID, PASSWORD, MERCHANT_PATH, hash, MERCHANT_ID, paymentTokenid);` : `String paymentTokenId = "XM1O0NgzHqGDGcGBlYDzmHtszIQz";
        String sessionId = "C9zF1hmAwhN034o7pARwxrrMfL8z";
        // Formula B: merchantId + loginId + password + paymentTokenId
        String message = MERCHANT_ID + LOGIN_ID + PASSWORD + paymentTokenId;
        String hash = generateHmacSHA512Hex(message, SECRET_KEY);

        String jsonPayload = """
        {
          "loginId": "%s",
          "password": "%s",
          "merchantId": "%s",
          "hash": "%s",
          "paymentTokenId": "%s",
          "sessionId": "%s",
          "amount": "1",
          "currency": "USD",
          "reason": "Cancelled order"
        }
        """.formatted(LOGIN_ID, PASSWORD, MERCHANT_ID, hash, paymentTokenId, sessionId);`}

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpointUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Status Code: " + response.statusCode());
        System.out.println("Response Body: " + response.body());
    }
}
`;
  }

  if (lang === 'python') {
    return `# ==========================================
# ACLEDA Toanchet Pay API: ${api.name}
# Language: Python 3
# ==========================================
import hmac
import hashlib
import time
import requests

MERCHANT_PATH = "${config.merchantPath}"
MERCHANT_ID = "${config.merchantId}"
LOGIN_ID = "${config.loginId}"
PASSWORD = "${config.password}"
SECRET_KEY = "${config.secretKey}"

def generate_hmac_sha512_hex(message: str, secret_key: str) -> str:
    """Computes uppercase 128-char hex HMAC-SHA512 exactly matching ACLEDA spec."""
    mac = hmac.new(secret_key.encode('utf-8'), message.encode('utf-8'), hashlib.sha512)
    return mac.hexdigest().upper()

${isFormulaA ? `txid = str(int(time.time() * 1000))
# Formula A: merchantID + loginId + password + txid
message = f"{MERCHANT_ID}{LOGIN_ID}{PASSWORD}{txid}"
hash_value = generate_hmac_sha512_hex(message, SECRET_KEY)

payload = {
    "loginId": LOGIN_ID,
    "password": PASSWORD,
    "merchantID": MERCHANT_ID,
    "hash": hash_value,
    "xpayTransaction": {
        "txid": txid,
        "purchaseAmount": "4000",
        "purchaseCurrency": "KHR",
        "purchaseDate": "12-11-2026",
        "purchaseDesc": "mobile",
        "invoiceid": txid,
        "item": "1",
        "quantity": "1",
        "expiryTime": "5",
${api.id === 'api-1-account' ? '        "paymentCard": "0"' : ''}${api.id === 'api-2-mpgs' ? '        "paymentCard": "1"' : ''}${api.id === 'api-3-khqr-string' ? '        "operationType": "5"' : ''}${api.id === 'api-4-khqr-webview' ? '        "operationType": "3"' : ''}${api.id === 'api-5-deeplink' ? '        "oprDevice": "android",\n        "callBackUrl": "appmobile://merchant.com.kh/callback",\n        "compName": "My Shop"' : ''}
    }
}` : api.id === 'api-6-status' ? `payment_token_id = "KTEeOOIVfqH0vX7cCvZnSAMuKqYz"
# Formula B: merchantId + loginId + password + paymentTokenid
message = f"{MERCHANT_ID}{LOGIN_ID}{PASSWORD}{payment_token_id}"
hash_value = generate_hmac_sha512_hex(message, SECRET_KEY)

payload = {
    "loginId": LOGIN_ID,
    "password": PASSWORD,
    "merchantName": MERCHANT_PATH,
    "hash": hash_value,
    "merchantId": MERCHANT_ID,  # lowercase d
    "paymentTokenid": payment_token_id  # lowercase id
}` : `payment_token_id = "XM1O0NgzHqGDGcGBlYDzmHtszIQz"
session_id = "C9zF1hmAwhN034o7pARwxrrMfL8z"
# Formula B: merchantId + loginId + password + paymentTokenId
message = f"{MERCHANT_ID}{LOGIN_ID}{PASSWORD}{payment_token_id}"
hash_value = generate_hmac_sha512_hex(message, SECRET_KEY)

payload = {
    "loginId": LOGIN_ID,
    "password": PASSWORD,
    "merchantId": MERCHANT_ID,
    "hash": hash_value,
    "paymentTokenId": payment_token_id,  # uppercase I
    "sessionId": session_id,
    "amount": "1",
    "currency": "USD",
    "reason": "Cancelled order"
}`}

# Notice Port 8443
url = "${fullUrl}"
response = requests.post(
    url,
    json=payload,
    headers={"Content-Type": "application/json"}
)

print("Status:", response.status_code)
print("Response JSON:", response.json())
`;
  }

  if (lang === 'php') {
    return `<?php
// ==========================================
// ACLEDA Toanchet Pay API: ${api.name}
// Language: PHP (cURL)
// ==========================================

$merchantPath = '${config.merchantPath}';
$merchantId   = '${config.merchantId}';
$loginId      = '${config.loginId}';
$password     = '${config.password}';
$secretKey    = '${config.secretKey}';

function generateHmacHex($message, $key) {
    return strtoupper(hash_hmac('sha512', $message, $key));
}

${isFormulaA ? `$txid = (string)time();
// Formula A: merchantID + loginId + password + txid
$message = $merchantId . $loginId . $password . $txid;
$hash = generateHmacHex($message, $secretKey);

$payload = [
    'loginId' => $loginId,
    'password' => $password,
    'merchantID' => $merchantId,
    'hash' => $hash,
    'xpayTransaction' => [
        'txid' => $txid,
        'purchaseAmount' => '4000',
        'purchaseCurrency' => 'KHR',
        'purchaseDate' => '12-11-2026',
        'purchaseDesc' => 'Goods purchase',
        'invoiceid' => $txid,
        'item' => '1',
        'quantity' => '1',
        'expiryTime' => '5',
${api.id === 'api-1-account' ? "        'paymentCard' => '0'" : ''}${api.id === 'api-2-mpgs' ? "        'paymentCard' => '1'" : ''}${api.id === 'api-3-khqr-string' ? "        'operationType' => '5'" : ''}${api.id === 'api-4-khqr-webview' ? "        'operationType' => '3'" : ''}${api.id === 'api-5-deeplink' ? "        'oprDevice' => 'android',\n        'callBackUrl' => 'appmobile://merchant.com.kh/callback',\n        'compName' => 'My Shop'" : ''}
    ]
];` : api.id === 'api-6-status' ? `$paymentTokenid = 'KTEeOOIVfqH0vX7cCvZnSAMuKqYz';
// Formula B: merchantId + loginId + password + paymentTokenid
$message = $merchantId . $loginId . $password . $paymentTokenid;
$hash = generateHmacHex($message, $secretKey);

$payload = [
    'loginId' => $loginId,
    'password' => $password,
    'merchantName' => $merchantPath,
    'hash' => $hash,
    'merchantId' => $merchantId,
    'paymentTokenid' => $paymentTokenid
];` : `$paymentTokenId = 'XM1O0NgzHqGDGcGBlYDzmHtszIQz';
$sessionId = 'C9zF1hmAwhN034o7pARwxrrMfL8z';
// Formula B: merchantId + loginId + password + paymentTokenId
$message = $merchantId . $loginId . $password . $paymentTokenId;
$hash = generateHmacHex($message, $secretKey);

$payload = [
    'loginId' => $loginId,
    'password' => $password,
    'merchantId' => $merchantId,
    'hash' => $hash,
    'paymentTokenId' => $paymentTokenId,
    'sessionId' => $sessionId,
    'amount' => '1',
    'currency' => 'USD',
    'reason' => 'Customer refund'
];`}

$url = '${fullUrl}';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`;
  }

  if (lang === 'csharp') {
    return `// ==========================================
// ACLEDA Toanchet Pay API: ${api.name}
// Language: C# (.NET 8)
// ==========================================
using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class AcledaClient
{
    private const string MerchantPath = "${config.merchantPath}";
    private const string MerchantId = "${config.merchantId}";
    private const string LoginId = "${config.loginId}";
    private const string Password = "${config.password}";
    private const string SecretKey = "${config.secretKey}";

    public static string GenerateHmacHex(string message, string key)
    {
        byte[] keyBytes = Encoding.UTF8.GetBytes(key);
        byte[] messageBytes = Encoding.UTF8.GetBytes(message);

        using var hmac = new HMACSHA512(keyBytes);
        byte[] hashBytes = hmac.ComputeHash(messageBytes);
        return Convert.ToHexString(hashBytes); // Uppercase 128-char hex
    }

    public static async Task Main()
    {
        string endpoint = "${fullUrl}";
        ${isFormulaA ? `string txid = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        // Formula A: merchantID + loginId + password + txid
        string message = MerchantId + LoginId + Password + txid;
        string hash = GenerateHmacHex(message, SecretKey);

        var payload = new
        {
            loginId = LoginId,
            password = Password,
            merchantID = MerchantId,
            hash = hash,
            xpayTransaction = new
            {
                txid = txid,
                purchaseAmount = "4000",
                purchaseCurrency = "KHR",
                purchaseDate = "12-11-2026",
                purchaseDesc = "mobile",
                invoiceid = txid,
                item = "1",
                quantity = "1",
                expiryTime = "5"${api.id === 'api-1-account' ? ',\n                paymentCard = "0"' : ''}${api.id === 'api-2-mpgs' ? ',\n                paymentCard = "1"' : ''}${api.id === 'api-3-khqr-string' ? ',\n                operationType = "5"' : ''}${api.id === 'api-4-khqr-webview' ? ',\n                operationType = "3"' : ''}${api.id === 'api-5-deeplink' ? ',\n                oprDevice = "android",\n                callBackUrl = "appmobile://merchant.com.kh/callback",\n                compName = "My Shop"' : ''}
            }
        };` : api.id === 'api-6-status' ? `string paymentTokenid = "KTEeOOIVfqH0vX7cCvZnSAMuKqYz";
        // Formula B: merchantId + loginId + password + paymentTokenid
        string message = MerchantId + LoginId + Password + paymentTokenid;
        string hash = GenerateHmacHex(message, SecretKey);

        var payload = new
        {
            loginId = LoginId,
            password = Password,
            merchantName = MerchantPath,
            hash = hash,
            merchantId = MerchantId,
            paymentTokenid = paymentTokenid
        };` : `string paymentTokenId = "XM1O0NgzHqGDGcGBlYDzmHtszIQz";
        string sessionId = "C9zF1hmAwhN034o7pARwxrrMfL8z";
        // Formula B: merchantId + loginId + password + paymentTokenId
        string message = MerchantId + LoginId + Password + paymentTokenId;
        string hash = GenerateHmacHex(message, SecretKey);

        var payload = new
        {
            loginId = LoginId,
            password = Password,
            merchantId = MerchantId,
            hash = hash,
            paymentTokenId = paymentTokenId,
            sessionId = sessionId,
            amount = "1",
            currency = "USD",
            reason = "Customer cancellation"
        };`}

        using var client = new HttpClient();
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(endpoint, content);
        string result = await response.Content.ReadAsStringAsync();
        Console.WriteLine(result);
    }
}
`;
  }

  if (lang === 'go') {
    return `// ==========================================
// ACLEDA Toanchet Pay API: ${api.name}
// Language: Go
// ==========================================
package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	merchantPath = "${config.merchantPath}"
	merchantID   = "${config.merchantId}"
	loginID      = "${config.loginId}"
	password     = "${config.password}"
	secretKey    = "${config.secretKey}"
)

func generateHmacHex(message, key string) string {
	mac := hmac.New(sha512.New, []byte(key))
	mac.Write([]byte(message))
	return strings.ToUpper(hex.EncodeToString(mac.Sum(nil)))
}

func main() {
	endpoint := "${fullUrl}"
	${isFormulaA ? `txid := fmt.Sprintf("%d", time.Now().UnixMilli())
	// Formula A: merchantID + loginId + password + txid
	message := merchantID + loginID + password + txid
	hash := generateHmacHex(message, secretKey)

	payload := map[string]interface{}{
		"loginId":    loginID,
		"password":   password,
		"merchantID": merchantID,
		"hash":       hash,
		"xpayTransaction": map[string]interface{}{
			"txid":             txid,
			"purchaseAmount":   "4000",
			"purchaseCurrency": "KHR",
			"purchaseDate":     "12-11-2026",
			"purchaseDesc":     "mobile",
			"invoiceid":        txid,
			"item":             "1",
			"quantity":         "1",
			"expiryTime":       "5",
${api.id === 'api-1-account' ? '			"paymentCard":      "0",' : ''}${api.id === 'api-2-mpgs' ? '			"paymentCard":      "1",' : ''}${api.id === 'api-3-khqr-string' ? '			"operationType":    "5",' : ''}${api.id === 'api-4-khqr-webview' ? '			"operationType":    "3",' : ''}${api.id === 'api-5-deeplink' ? '			"oprDevice":        "android",\n			"callBackUrl":      "appmobile://merchant.com.kh/callback",\n			"compName":         "My Shop",' : ''}
		},
	}` : api.id === 'api-6-status' ? `paymentTokenid := "KTEeOOIVfqH0vX7cCvZnSAMuKqYz"
	// Formula B: merchantId + loginId + password + paymentTokenid
	message := merchantID + loginID + password + paymentTokenid
	hash := generateHmacHex(message, secretKey)

	payload := map[string]interface{}{
		"loginId":        loginID,
		"password":       password,
		"merchantName":   merchantPath,
		"hash":           hash,
		"merchantId":     merchantID,
		"paymentTokenid": paymentTokenid,
	}` : `paymentTokenId := "XM1O0NgzHqGDGcGBlYDzmHtszIQz"
	sessionID := "C9zF1hmAwhN034o7pARwxrrMfL8z"
	// Formula B: merchantId + loginId + password + paymentTokenId
	message := merchantID + loginID + password + paymentTokenId
	hash := generateHmacHex(message, secretKey)

	payload := map[string]interface{}{
		"loginId":        loginID,
		"password":       password,
		"merchantId":     merchantID,
		"hash":           hash,
		"paymentTokenId": paymentTokenId,
		"sessionId":      sessionID,
		"amount":         "1",
		"currency":       "USD",
		"reason":         "Cancelled order",
	}`}

	jsonBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %s\\nResponse: %s\\n", resp.Status, string(body))
}
`;
  }

  // Dart / Flutter fallback
  return `// ==========================================
// ACLEDA Toanchet Pay API: ${api.name}
// Language: Dart / Flutter
// ==========================================
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;

String generateHmacHex(String message, String secretKey) {
  final hmacSha512 = Hmac(sha512, utf8.encode(secretKey));
  final digest = hmacSha512.convert(utf8.encode(message));
  return digest.toString().toUpperCase(); // 128-char uppercase hex
}

Future<void> main() async {
  const merchantPath = '${config.merchantPath}';
  const merchantId = '${config.merchantId}';
  const loginId = '${config.loginId}';
  const password = '${config.password}';
  const secretKey = '${config.secretKey}';

  final endpoint = Uri.parse(
    '${fullUrl}',
  );

  ${isFormulaA ? `final txid = DateTime.now().millisecondsSinceEpoch.toString();
  // Formula A: merchantID + loginId + password + txid
  final message = '$merchantId$loginId$password$txid';
  final hash = generateHmacHex(message, secretKey);

  final payload = {
    'loginId': loginId,
    'password': password,
    'merchantID': merchantId,
    'hash': hash,
    'xpayTransaction': {
      'txid': txid,
      'purchaseAmount': '4000',
      'purchaseCurrency': 'KHR',
      'purchaseDate': '12-11-2026',
      'purchaseDesc': 'mobile',
      'invoiceid': txid,
      'item': '1',
      'quantity': '1',
      'expiryTime': '5',
${api.id === 'api-1-account' ? "      'paymentCard': '0'," : ''}${api.id === 'api-2-mpgs' ? "      'paymentCard': '1'," : ''}${api.id === 'api-3-khqr-string' ? "      'operationType': '5'," : ''}${api.id === 'api-4-khqr-webview' ? "      'operationType': '3'," : ''}${api.id === 'api-5-deeplink' ? "      'oprDevice': 'android',\n      'callBackUrl': 'appmobile://merchant.com.kh/callback',\n      'compName': 'My Shop'," : ''}
    }
  };` : api.id === 'api-6-status' ? `const paymentTokenid = 'KTEeOOIVfqH0vX7cCvZnSAMuKqYz';
  // Formula B: merchantId + loginId + password + paymentTokenid
  final message = '$merchantId$loginId$password$paymentTokenid';
  final hash = generateHmacHex(message, secretKey);

  final payload = {
    'loginId': loginId,
    'password': password,
    'merchantName': merchantPath,
    'hash': hash,
    'merchantId': merchantId,
    'paymentTokenid': paymentTokenid,
  };` : `const paymentTokenId = 'XM1O0NgzHqGDGcGBlYDzmHtszIQz';
  const sessionId = 'C9zF1hmAwhN034o7pARwxrrMfL8z';
  // Formula B: merchantId + loginId + password + paymentTokenId
  final message = '$merchantId$loginId$password$paymentTokenId';
  final hash = generateHmacHex(message, secretKey);

  final payload = {
    'loginId': loginId,
    'password': password,
    'merchantId': merchantId,
    'hash': hash,
    'paymentTokenId': paymentTokenId,
    'sessionId': sessionId,
    'amount': '1',
    'currency': 'USD',
    'reason': 'Cancelled order',
  };`}

  final response = await http.post(
    endpoint,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode(payload),
  );

  print('Status: \${response.statusCode}');
  print('Body: \${response.body}');
}
`;
}
