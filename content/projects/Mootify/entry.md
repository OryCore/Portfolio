---
title: "Mootify"
date: "Mar 2024"
role: "Engineer"
description: "A wearable messenger for couples. An ESP32-C3 watch with a 1.47-inch LCD, connected over BLE to an Ionic React app, that shows emoji feelings and short messages from your partner on your wrist."
tags: ["Embedded", "Mobile", "Hardware", "BLE"]
---

Mootify is a wrist-worn display for couples. One partner picks an emoji and an optional short message in a phone app, and a second or two later it appears on the other partner's watch. The watch is built around an ESP32-C3 with a 1.47-inch LCD and talks to the phone over BLE. The app is Ionic React.

![Mootify on the wrist, showing a received emoji and message](img1.webp)

Messages are one-way by design, with no replies and no chat thread. You just share how you feel at that moment!

| Battery life           | Display                | Radio            | Stack                                    |
| ---------------------- | ---------------------- | ---------------- | ---------------------------------------- |
| ~72 h on a 70 mAh LiPo | 1.47" 172×320 ST7789V3 | BLE 5 (ESP32-C3) | Firmware, app, database, functions, push |

---

## Hardware

I chose the **Seeed Studio XIAO ESP32-C3** because it integrates a USB-serial bridge and a LiPo charger, which removed two external ICs from a tight board. It also has native BLE 5, which covers the radio requirement.

The display is a **1.47-inch IPS panel** with an ST7789V3 controller on SPI (172×320, 262K colours). Its rounded corners suit the wristband form factor. The battery is a **70 mAh LiPo**, the only cell that fit the enclosure.

| Component | Choice             | Why                               |
| --------- | ------------------ | --------------------------------- |
| MCU       | XIAO ESP32-C3      | Onboard USB-serial + LiPo charger |
| Display   | 1.47" ST7789V3 IPS | Rounded, SPI, fits the enclosure  |
| Battery   | 70 mAh LiPo        | Only cell that fit the enclosure  |
| Comms     | BLE (ESP32 native) | Low power, no infrastructure      |

The display uses standard SPI, with one GPIO for the backlight and one for the button.

| Signal    | GPIO | Notes                          |
| --------- | ---- | ------------------------------ |
| Button    | D0   | Wake / sleep, `INPUT_PULLUP`   |
| Backlight | D1   | Must be held during deep sleep |
| SPI MOSI  | D10  | LCD data                       |
| SPI SCK   | D8   | LCD clock                      |
| SPI CS    | D7   | LCD chip select                |
| SPI DC    | D3   | Data / command select          |
| SPI RST   | D2   | Hardware reset                 |

---

## Firmware

The firmware is C++ on the Arduino-compatible ESP-IDF libraries. It handles BLE writes and renders to the display, and sleeps the rest of the time.

`setup()` shuts down Wi-Fi first, since the radio can draw around 200 mA when active and is never needed. It then configures the GPIOs, registers the button as a deep-sleep wake source, and initialises the display and BLE.

```cpp
void setup() {
  Serial.begin(115200);

  // Release any GPIO hold state left over from before sleep
  gpio_hold_dis((gpio_num_t)GFX_BL);

  // Kill Wi-Fi completely: not just stopped, deinitialized
  esp_wifi_stop();
  esp_wifi_deinit();

  pinMode(GFX_BL, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Button wakes the device from deep sleep when pulled low
  esp_deep_sleep_enable_gpio_wakeup(
    1 << BUTTON_PIN,
    ESP_GPIO_WAKEUP_GPIO_LOW
  );

  initGFX();
  initBLE();
}
```

Calling `esp_wifi_deinit()` instead of only `esp_wifi_stop()` releases the transceiver from the power domain, which saves about 1 mA at idle. That is a meaningful share of the budget on a 70 mAh cell.

### BLE server

The watch advertises one GATT service with a single read/write characteristic. The app connects, writes the payload, and disconnects. There are no persistent connections or subscriptions. I kept the BLE surface small to limit the amount of code to test and maintain.

```cpp
void initBLE() {
  BLEDevice::init("Mootify");

  BLEServer  *pServer  = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);

  BLECharacteristic *pChar = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE
  );

  pChar->setCallbacks(new MyCallbacks());
  pService->start();

  BLEAdvertising *pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  pAdv->start();
}
```

### Payload format

The app sends `{emojiIndex}&{message}`, for example `4&You're amazing!`. I used `&` as the delimiter because it cannot appear in an emoji index and is unlikely in a short message. Messages are capped at 20 characters, which keeps each payload small enough for a single write.

```cpp
class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue();

    if (value.length() > 0) {
      char receivedText[21] = { 0 };
      memcpy(receivedText, value.c_str(), value.length());
      receivedText[value.length()] = '\0';

      // First token: emoji array index
      char *splitText = strtok(receivedText, "&");
      int   number    = atoi(splitText);
      ind             = number;

      // Second token: message string
      splitText = strtok(NULL, "&");
      if (splitText != NULL) {
        strcpy(recText, splitText);
      }
    }
  }
};
```

`ind` is a global that selects the image from a flash array, and `recText` is the display buffer. The render loop picks up both on its next tick.

### Rendering

Emotion images are stored as 64×64 RGB565 arrays of `uint16_t`, about 8 KB each, and compiled into the binary. This avoids an SD card or filesystem entirely, and drawing is a directly from the flash.

```cpp
if (ind >= 0 && !isDrawn) {
  isDrawn = true;

  gfx->fillScreen(RGB565_BLACK);
  gfx->setRotation(1);

  // Image directly from flash
  gfx->draw16bitRGBBitmap(128, IMG_Y,
    images[ind], IMG_WIDTH, IMG_HEIGHT);

  // Overlay the text below
  gfx->setCursor(10, 172);
  gfx->setTextColor(RGB565_WHITE);
  gfx->setTextSize(2, 3, 0);
  gfx->setRotation(2);
  gfx->println(String(recText));
}
```

The `isDrawn` flag prevents a redraw on every tick. It resets when the device goes to sleep, so each wake starts from a clean screen.

---

## Power management

Runtime is battery capacity divided by average current:

$$
t_{\text{runtime}} = \frac{C_{\text{battery}}}{I_{\text{avg}}}
$$

With $C = 70\,\text{mAh}$ and a measured runtime of about 72 hours, the average draw works out to roughly 1 mA. That only holds if deep sleep current is genuinely low.

```cpp
void goToSleep() {
  ind     = -1;
  isDrawn = false;

  gfx->fillScreen(RGB565_BLACK);
  digitalWrite(GFX_BL, LOW);

  // Hold the backlight pin low during deep sleep
  // Without this it floats and the panel draws current anyway
  gpio_hold_en((gpio_num_t)GFX_BL);

  esp_deep_sleep_start();
}
```

The watch sleeps after 30 seconds of inactivity or a 3-second button hold. The `gpio_hold_en` call locks the backlight pin's state through deep sleep. My first prototype measured **4 mA** in sleep instead of the expected **22 µA**, roughly 180 times higher, because the backlight pin was floating and partly powering the panel.

:::note type=purple title="Debugging tip: floating GPIOs"
If an ESP32 design shows unexpectedly high deep-sleep current, check every output GPIO that isn't explicitly held. A floating pin on an LCD backlight or LED driver is a common cause, and `gpio_hold_en` fixes it.
:::

---

## Mobile app

![The Mootify app: friend list, emoji carousel](img2.webp)

The app uses **Ionic React with Capacitor**, which gives one codebase for iOS and Android, and TailwindCSS for styling.

**Auth and friends.** Supabase handles authentication. On first login the app creates a profile with a short, readable ID that is easy to read out over a call. Partners add each other by entering that ID. Friendships are stored bidirectionally, so there is no accept step. I left it out because the app is meant for two people who already know each other.

**Sending.** The user selects a friend, swipes through the emoji carousel, optionally types a message (20 characters, enforced in the UI), and taps **Send**.

**Receiving.** The push opens the pending message in the app, which asks **"Display on Watch?"**. On confirmation, the Capacitor BLE plugin scans for the watch by service UUID, connects, writes the payload, and disconnects.

```typescript
import { BleClient } from "@capacitor-community/bluetooth-le";

async function sendToWatch(emojiIndex: number, message: string) {
  await BleClient.initialize();

  const device = await BleClient.requestDevice({
    services: [SERVICE_UUID],
  });

  await BleClient.connect(device.deviceId);

  const payload = `${emojiIndex}&${message}`;
  const encoded = new TextEncoder().encode(payload);

  await BleClient.write(device.deviceId, SERVICE_UUID, CHARACTERISTIC_UUID, dataViewFromBuffer(encoded));

  await BleClient.disconnect(device.deviceId);
}
```

---

## Results

| Metric                             | Result  |
| ---------------------------------- | ------- |
| Battery life                       | 68–74 h |
| Deep-sleep current                 | ~22 µA  |
| Local latency (BLE scan to render) | ~400 ms |

Of the 400 ms local latency, about 250 ms is BLE scan and connection setup, and the write and render take around 40 ms.

The 22 µA deep-sleep figure sits above the ESP32-C3's rated 5 µA because the display driver and LDO add their own quiescent current.

:::note type=warning title="Android BLE device ID caching"
On Android, the Capacitor BLE plugin returns a device ID derived from a cached advertisement. When the Bluetooth cache is cleared, which Android does periodically, that ID changes and the app can no longer reconnect to a paired watch. The fix is a fallback scan by service UUID, which adds up to about 800 ms in the worst case. In hindsight, the UUID scan should have been the primary reconnection path from the start.
:::

---

## Next steps

The prototype runs on a XIAO breakout board. The next revision is a custom PCB designed in EasyEDA with:

- An ESP32-C6 or a RISC-V variant for better BLE 5 support
- A proper LDO rail with real decoupling capacitors
- A 200 mAh LiPo battery
- Vibration feedback

Planned app features are a larger emotion library, message history, haptic patterns per emotion, a clock mode when no message is pending, and acknowledgement replies, where a button press on the watch sends a "❤️ received" back to the sender.
