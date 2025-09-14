/**
 * Secure Password Generator
 * 
 * ENTROPY CALCULATION:
 * entropy = length * log2(pool_size)
 * where pool_size is determined by selected character sets
 * 
 * CRACK TIME FORMULA:
 * time = (2^entropy / 2) / guesses_per_second
 * Average case: half the keyspace needs to be searched
 * 
 * DEFAULT ASSUMPTIONS:
 * - Online attacks: 10^4 (10,000) guesses/sec
 * - Offline GPU attacks: 10^10 (10,000,000,000) guesses/sec
 * 
 * DICTIONARY WORD PENALTY:
 * - Detected common words reduce entropy by 10-20 bits
 * - Partial matches get smaller penalties
 */

class PasswordGenerator {
    constructor() {
        // Character sets
        this.charSets = {
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            digits: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        };

        // Common words for dictionary detection (simplified list)
        this.commonWords = new Set([
            'password', 'admin', 'user', 'login', 'welcome', 'hello', 'world',
            'secret', 'test', 'demo', 'sample', 'example', 'default', 'guest',
            'master', 'super', 'root', 'system', 'public', 'private', 'secure',
            'access', 'account', 'profile', 'settings', 'config', 'database',
            'server', 'client', 'company', 'business', 'office', 'home',
            'family', 'personal', 'email', 'website', 'internet', 'computer'
        ]);

        // Crack time constants
        this.guessesPerSecond = {
            online: 10000, // 10^4
            offline: 10000000000 // 10^10
        };

        // Wait for DOM to be ready
        this.initializeElements();
        this.bindEvents();
        this.generateSamplePassword();
    }

    initializeElements() {
        // Generator inputs
        this.wordInput = document.getElementById('word-input');
        this.numberInput = document.getElementById('number-input');
        this.symbolsInput = document.getElementById('symbols-input');
        this.lengthSlider = document.getElementById('length-slider');
        this.lengthValue = document.getElementById('length-value');
        
        // Character set checkboxes
        this.lowercaseCheck = document.getElementById('lowercase');
        this.uppercaseCheck = document.getElementById('uppercase');
        this.digitsCheck = document.getElementById('digits');
        this.symbolsCheck = document.getElementById('symbols');
        
        // Buttons
        this.generateBtn = document.getElementById('generate-btn');
        this.regenerateBtn = document.getElementById('regenerate-btn');
        this.copyBtn = document.getElementById('copy-btn');
        
        // Password display
        this.generatedPassword = document.getElementById('generated-password');
        
        // Strength analysis elements
        this.strengthLabel = document.getElementById('strength-label');
        this.strengthFill = document.getElementById('strength-fill');
        this.entropyValue = document.getElementById('entropy-value');
        this.onlineTime = document.getElementById('online-time');
        this.offlineTime = document.getElementById('offline-time');
        this.strengthExplanation = document.getElementById('strength-explanation');
        
        // Password tester
        this.testPassword = document.getElementById('test-password');
        this.testWarnings = document.getElementById('test-warnings');
        this.testStrengthLabel = document.getElementById('test-strength-label');
        this.testStrengthFill = document.getElementById('test-strength-fill');
        this.testEntropyValue = document.getElementById('test-entropy-value');
        this.testOnlineTime = document.getElementById('test-online-time');
        this.testOfflineTime = document.getElementById('test-offline-time');
        this.suggestions = document.getElementById('suggestions');
        
        // Toast
        this.copyToast = document.getElementById('copy-toast');

        // Initialize length display
        if (this.lengthValue) {
            this.lengthValue.textContent = this.lengthSlider.value;
        }
    }

    bindEvents() {
        // Length slider with immediate feedback
        this.lengthSlider.addEventListener('input', (e) => {
            this.lengthValue.textContent = e.target.value;
            // Regenerate password if one exists
            if (this.generatedPassword.value) {
                this.generatePassword();
            }
        });

        // Generate buttons - ensure both work
        this.generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.generatePassword();
        });
        
        this.regenerateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.generatePassword();
        });

        // Copy button
        this.copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.copyPassword();
        });

        // Password field click to select
        this.generatedPassword.addEventListener('click', () => {
            this.generatedPassword.select();
        });

        // Input field events for immediate feedback
        this.wordInput.addEventListener('input', () => {
            if (this.generatedPassword.value) {
                setTimeout(() => this.generatePassword(), 100);
            }
        });

        this.numberInput.addEventListener('input', () => {
            if (this.generatedPassword.value) {
                setTimeout(() => this.generatePassword(), 100);
            }
        });

        this.symbolsInput.addEventListener('input', () => {
            if (this.generatedPassword.value) {
                setTimeout(() => this.generatePassword(), 100);
            }
        });

        // Test password input
        this.testPassword.addEventListener('input', (e) => {
            const password = e.target.value;
            if (password) {
                this.analyzeTestPassword(password);
            } else {
                this.clearTestResults();
            }
        });

        // Character set changes should trigger re-generation
        [this.lowercaseCheck, this.uppercaseCheck, this.digitsCheck, this.symbolsCheck].forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (this.generatedPassword.value) {
                    this.generatePassword();
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'g') {
                    e.preventDefault();
                    this.generatePassword();
                }
            }
        });
    }

    generatePassword() {
        try {
            const settings = this.getGenerationSettings();
            if (!this.validateSettings(settings)) return;

            const password = this.createPassword(settings);
            this.generatedPassword.value = password;
            this.analyzePassword(password, 'generated');
            
            // Add subtle animation
            this.generatedPassword.style.transform = 'scale(1.02)';
            this.generatedPassword.style.transition = 'transform 150ms ease';
            setTimeout(() => {
                this.generatedPassword.style.transform = 'scale(1)';
            }, 150);
            
        } catch (error) {
            console.error('Password generation error:', error);
            this.showError('Failed to generate password. Please try again.');
        }
    }

    getGenerationSettings() {
        return {
            word: this.wordInput.value.trim(),
            number: this.numberInput.value.trim(),
            customSymbols: this.symbolsInput.value.trim(),
            length: parseInt(this.lengthSlider.value),
            charSets: {
                lowercase: this.lowercaseCheck.checked,
                uppercase: this.uppercaseCheck.checked,
                digits: this.digitsCheck.checked,
                symbols: this.symbolsCheck.checked
            }
        };
    }

    validateSettings(settings) {
        // Check if at least one character set is selected
        const hasCharSet = Object.values(settings.charSets).some(Boolean);
        if (!hasCharSet) {
            this.showError('Please select at least one character type.');
            return false;
        }
        
        if (settings.length < 4 || settings.length > 64) {
            this.showError('Password length must be between 4 and 64 characters.');
            return false;
        }
        
        return true;
    }

    createPassword(settings) {
        // Build character pool based on selected sets
        let pool = '';
        if (settings.charSets.lowercase) pool += this.charSets.lowercase;
        if (settings.charSets.uppercase) pool += this.charSets.uppercase;
        if (settings.charSets.digits) pool += this.charSets.digits;
        if (settings.charSets.symbols) pool += this.charSets.symbols;

        // Add custom symbols to pool if provided
        if (settings.customSymbols) {
            // Remove duplicates and add unique symbols to pool
            const uniqueSymbols = [...new Set(settings.customSymbols)].filter(char => !pool.includes(char)).join('');
            pool += uniqueSymbols;
        }

        if (pool.length === 0) {
            throw new Error('No character pool available');
        }

        // Prepare seeds
        const seeds = [];
        if (settings.word) seeds.push(settings.word);
        if (settings.number) seeds.push(settings.number.toString());
        
        // Combine all seeds
        const seedString = seeds.join('');
        
        let password = '';
        
        if (seedString.length > 0) {
            // Use seeds intelligently
            const maxSeedChars = Math.floor(settings.length * 0.6); // Max 60% from seeds
            const seedCharsToUse = Math.min(seedString.length, maxSeedChars);
            
            // Take characters from seed
            for (let i = 0; i < seedCharsToUse; i++) {
                password += seedString[i];
            }
            
            // Fill remaining with random characters
            const remainingLength = settings.length - seedCharsToUse;
            for (let i = 0; i < remainingLength; i++) {
                password += this.getSecureRandomChar(pool);
            }
            
            // Shuffle the entire password
            password = this.shuffleString(password);
        } else {
            // Generate completely random password
            for (let i = 0; i < settings.length; i++) {
                password += this.getSecureRandomChar(pool);
            }
        }

        // Ensure exact length
        return password.substring(0, settings.length);
    }

    getSecureRandomChar(pool) {
        if (pool.length === 0) return '';
        const randomIndex = this.getSecureRandomInt(0, pool.length);
        return pool[randomIndex];
    }

    getSecureRandomInt(min, max) {
        const range = max - min;
        if (range <= 0) return min;
        
        const bytesNeeded = Math.ceil(Math.log2(range) / 8);
        const maxValue = Math.pow(256, bytesNeeded);
        const maxUsableValue = Math.floor(maxValue / range) * range;
        
        let randomValue;
        do {
            const randomBytes = new Uint8Array(bytesNeeded);
            crypto.getRandomValues(randomBytes);
            randomValue = randomBytes.reduce((acc, byte, index) => {
                return acc + byte * Math.pow(256, index);
            }, 0);
        } while (randomValue >= maxUsableValue);
        
        return min + (randomValue % range);
    }

    shuffleString(str) {
        const arr = str.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.getSecureRandomInt(0, i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    }

    analyzePassword(password, context = 'generated') {
        if (!password) {
            this.clearAnalysis(context);
            return;
        }

        const analysis = this.calculatePasswordStrength(password);
        this.displayAnalysis(analysis, context);

        if (context === 'test') {
            this.showWarningsAndSuggestions(password, analysis);
        }
    }

    calculatePasswordStrength(password) {
        // Determine character pool size based on actual characters in password
        let poolSize = 0;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSymbol = /[^a-zA-Z0-9]/.test(password);
        
        if (hasLower) poolSize += 26;
        if (hasUpper) poolSize += 26;
        if (hasDigit) poolSize += 10;
        if (hasSymbol) {
            // Count unique symbols in password
            const symbols = password.match(/[^a-zA-Z0-9]/g) || [];
            const uniqueSymbols = new Set(symbols).size;
            poolSize += Math.max(uniqueSymbols, 10); // Assume at least 10 possible symbols
        }

        // Calculate base entropy
        let entropy = password.length * Math.log2(Math.max(poolSize, 1));

        // Dictionary word penalty
        const wordPenalty = this.calculateWordPenalty(password);
        entropy = Math.max(0, entropy - wordPenalty.penalty);

        // Calculate crack times
        const onlineTime = this.calculateCrackTime(entropy, this.guessesPerSecond.online);
        const offlineTime = this.calculateCrackTime(entropy, this.guessesPerSecond.offline);

        // Determine strength level
        const strength = this.getStrengthLevel(entropy);

        return {
            entropy: Math.round(entropy * 10) / 10,
            poolSize,
            onlineTime,
            offlineTime,
            strength,
            wordPenalty: wordPenalty.penalty,
            detectedWords: wordPenalty.words
        };
    }

    calculateWordPenalty(password) {
        const words = [];
        let penalty = 0;
        const lowerPassword = password.toLowerCase();

        // Check for dictionary words
        this.commonWords.forEach(word => {
            if (lowerPassword.includes(word)) {
                words.push(word);
                penalty += Math.min(15, word.length + 3);
            }
        });

        // Check for years (1900-2099)
        const yearMatch = password.match(/19\d{2}|20\d{2}/);
        if (yearMatch) {
            words.push('year pattern');
            penalty += 8;
        }

        // Check for simple patterns
        if (/123|abc|qwe|asd|zxc/i.test(password)) {
            words.push('keyboard pattern');
            penalty += 10;
        }

        // Check for repetitive patterns
        if (/(.)\1{2,}/.test(password)) {
            words.push('repetitive characters');
            penalty += 12;
        }

        return { words, penalty: Math.min(penalty, 25) }; // Cap total penalty
    }

    calculateCrackTime(entropy, guessesPerSecond) {
        if (entropy <= 0) return 'Instant';
        
        const totalGuesses = Math.pow(2, entropy) / 2; // Average case
        const seconds = totalGuesses / guessesPerSecond;
        
        return this.formatTime(seconds);
    }

    formatTime(seconds) {
        if (seconds < 1) return 'Instant';
        if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
        if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.ceil(seconds / 3600)} hours`;
        if (seconds < 31536000) return `${Math.ceil(seconds / 86400)} days`;
        if (seconds < 3153600000) return `${Math.ceil(seconds / 31536000)} years`;
        if (seconds < 315360000000) return `${Math.ceil(seconds / 3153600000)} centuries`;
        return 'Eons';
    }

    getStrengthLevel(entropy) {
        if (entropy < 30) return { level: 'weak', percentage: 20 };
        if (entropy < 50) return { level: 'fair', percentage: 40 };
        if (entropy < 70) return { level: 'good', percentage: 60 };
        if (entropy < 90) return { level: 'strong', percentage: 80 };
        return { level: 'very-strong', percentage: 100 };
    }

    displayAnalysis(analysis, context) {
        const prefix = context === 'test' ? 'test-' : '';
        
        const strengthLabel = document.getElementById(`${prefix}strength-label`);
        const strengthFill = document.getElementById(`${prefix}strength-fill`);
        const entropyValue = document.getElementById(`${prefix}entropy-value`);
        const onlineTime = document.getElementById(`${prefix}online-time`);
        const offlineTime = document.getElementById(`${prefix}offline-time`);

        if (!strengthLabel) return;

        // Update strength label and bar
        strengthLabel.textContent = analysis.strength.level.replace('-', ' ').toUpperCase();
        strengthLabel.className = `strength-label ${analysis.strength.level}`;
        
        if (strengthFill) {
            strengthFill.style.width = `${analysis.strength.percentage}%`;
            strengthFill.className = `strength-fill ${analysis.strength.level}`;
        }

        // Update entropy and times
        if (entropyValue) entropyValue.textContent = analysis.entropy;
        if (onlineTime) onlineTime.textContent = analysis.onlineTime;
        if (offlineTime) offlineTime.textContent = analysis.offlineTime;

        // Update explanation for generated passwords
        if (context === 'generated' && this.strengthExplanation) {
            let explanation = `This password has ${analysis.entropy} bits of entropy. `;
            if (analysis.wordPenalty > 0) {
                explanation += `Security reduced by ${analysis.wordPenalty} bits due to predictable patterns. `;
            }
            explanation += `At 10 billion guesses/sec, it would take ${analysis.offlineTime} to crack on average.`;
            this.strengthExplanation.textContent = explanation;
        }
    }

    clearAnalysis(context) {
        const prefix = context === 'test' ? 'test-' : '';
        
        const elements = [
            `${prefix}strength-label`,
            `${prefix}entropy-value`, 
            `${prefix}online-time`,
            `${prefix}offline-time`
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '-';
        });

        const strengthFill = document.getElementById(`${prefix}strength-fill`);
        if (strengthFill) strengthFill.style.width = '0%';

        if (context === 'generated' && this.strengthExplanation) {
            this.strengthExplanation.textContent = '-';
        }
    }

    analyzeTestPassword(password) {
        this.analyzePassword(password, 'test');
    }

    clearTestResults() {
        this.clearAnalysis('test');
        if (this.testWarnings) this.testWarnings.innerHTML = '';
        if (this.suggestions) this.suggestions.innerHTML = '';
    }

    showWarningsAndSuggestions(password, analysis) {
        // Clear previous content
        if (this.testWarnings) this.testWarnings.innerHTML = '';
        if (this.suggestions) this.suggestions.innerHTML = '';

        const warnings = [];
        const suggestions = [];

        // Check for user's input word in password
        const userWord = this.wordInput.value.trim().toLowerCase();
        if (userWord && password.toLowerCase().includes(userWord)) {
            warnings.push(`Your password contains "${userWord}" which you specified in the generator. This makes it more predictable.`);
        }

        // Check for detected words
        if (analysis.detectedWords.length > 0) {
            warnings.push(`Detected patterns: ${analysis.detectedWords.join(', ')}. This reduces security.`);
        }

        // Generate suggestions based on analysis
        if (password.length < 12) {
            suggestions.push('Increase length to 12+ characters for better security');
        }

        if (!/[a-z]/.test(password)) {
            suggestions.push('Add lowercase letters (a-z)');
        }

        if (!/[A-Z]/.test(password)) {
            suggestions.push('Add uppercase letters (A-Z)');
        }

        if (!/[0-9]/.test(password)) {
            suggestions.push('Add numbers (0-9)');
        }

        if (!/[^a-zA-Z0-9]/.test(password)) {
            suggestions.push('Add special characters (!@#$...)');
        }

        if (analysis.entropy < 50) {
            suggestions.push('Consider using a longer password or more character variety');
        }

        if (/(.)\1{2,}/.test(password)) {
            suggestions.push('Avoid repeating characters (e.g., "aaa" or "111")');
        }

        if (/^[a-z]+$/i.test(password)) {
            suggestions.push('Mix in numbers and symbols to increase complexity');
        }

        // Display warnings
        warnings.forEach(warning => {
            if (this.testWarnings) {
                const div = document.createElement('div');
                div.className = 'warning';
                div.textContent = warning;
                this.testWarnings.appendChild(div);
            }
        });

        // Display suggestions
        suggestions.forEach(suggestion => {
            if (this.suggestions) {
                const div = document.createElement('div');
                div.className = 'suggestion';
                div.textContent = suggestion;
                this.suggestions.appendChild(div);
            }
        });
    }

    async copyPassword() {
        try {
            const password = this.generatedPassword.value;
            if (!password) {
                this.showError('No password to copy');
                return;
            }

            await navigator.clipboard.writeText(password);
            this.showToast();
        } catch (err) {
            // Fallback for older browsers
            try {
                this.generatedPassword.select();
                document.execCommand('copy');
                this.showToast();
            } catch (fallbackErr) {
                this.showError('Unable to copy password. Please select and copy manually.');
            }
        }
    }

    showToast() {
        if (this.copyToast) {
            this.copyToast.classList.remove('hidden');
            this.copyToast.classList.add('show');
            setTimeout(() => {
                this.copyToast.classList.remove('show');
                setTimeout(() => {
                    this.copyToast.classList.add('hidden');
                }, 300);
            }, 2000);
        }
    }

    showError(message) {
        console.error(message);
        // Create a temporary error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 3000);
    }

    generateSamplePassword() {
        // Set default values
        this.lengthSlider.value = 16;
        this.lengthValue.textContent = '16';
        
        // Generate a sample password on load
        const sampleSettings = {
            word: '',
            number: '',
            customSymbols: '',
            length: 16,
            charSets: {
                lowercase: true,
                uppercase: true,
                digits: true,
                symbols: true
            }
        };

        const samplePassword = this.createPassword(sampleSettings);
        this.generatedPassword.value = samplePassword;
        this.analyzePassword(samplePassword, 'generated');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new PasswordGenerator();
    } catch (error) {
        console.error('Failed to initialize Password Generator:', error);
    }
});

// Export for potential testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordGenerator;
}
