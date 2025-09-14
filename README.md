# Secure Password Generator

A modern, minimal, single-file web app to generate strong passwords and test yours locally — no servers, no tracking. Built with only HTML, CSS, and vanilla JS.

---

## Features

* **Password Generator**

  * Input optional **word/phrase**, **number seed**, and **symbols**.
  * Control **character length** (4–64).
  * Choose character sets: lowercase, uppercase, digits, symbols.
  * Uses `crypto.getRandomValues` for cryptographically strong randomness.
  * Generated password is always exactly the requested length.
  * Smart handling if seeds exceed length (scramble/trim).

* **Password Display**

  * Password shown in large, selectable text.
  * Copy to clipboard button with success animation.
  * Regenerate with same settings.

* **Strength & Crack-Time Analysis**

  * Entropy calculation: `entropy = length * log2(pool_size)`.
  * Detects user-supplied dictionary words and applies entropy penalty.
  * Estimates crack times for:

    * Online attack (10^4 guesses/sec)
    * Offline GPU attack (10^10 guesses/sec)
  * Displays human-friendly times (seconds → centuries).
  * Strength meter (Weak → Very Strong).
  * Short, helpful explanations.

* **Password Tester**

  * Paste your own password for analysis.
  * Shows entropy, strength, crack-time breakdown.
  * Suggestions for improvement (length, variety, avoiding common words).

* **UX & Accessibility**

  * Responsive (mobile-first) design.
  * Keyboard accessible controls.
  * ARIA live regions for updates.
  * Minimal, cozy design with rounded corners, subtle shadows, and micro-animations.
  * High-contrast friendly.

* **Privacy & Security**

  * Everything runs **100% locally in your browser**.
  * No external fonts, icons, or libraries.
  * No network requests — nothing leaves your device.

---

## Tech Notes

* **Randomness**: Generated with `window.crypto.getRandomValues`.
* **Entropy Formula**: `H = L * log2(N)`, where:

  * `L` = password length
  * `N` = size of character pool
* **Crack Time Formula**: `T = (2^H) / R`, where:

  * `R` = guesses per second (e.g., 10^4 or 10^10)
  * Assumes brute force (no smarter attacks).

---

## Usage

1. Open `index.html` in any modern browser (no server required).
2. Customize your generator settings.
3. Click **Generate Password**.
4. Copy your password, check its strength, and adjust as needed.
5. Test your own password in the tester box.

---

## Development

* All code is contained in a single `index.html` file.
* Written with **readable ES6** and inline comments.
* No build tools, no dependencies.

---

## License

MIT License — use freely, but security is **your own responsibility**.

---

### ⚡ Note

This project is educational and practical, but no tool can guarantee perfect security. Always combine strong passwords with good security hygiene (2FA, password managers, unique passwords per site).
